import { Request, Response, NextFunction } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import logger from "../utils/logger";
import { runAgent } from "../services/agent.service";
import {
  listSnapshots as listSnapshotsService,
  restoreSnapshot as restoreSnapshotService,
  undoLast as undoLastService,
} from "../services/snapshot.service";
import { extractText } from "../services/parser.service";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function ownResume(resumeId: string, userId: string): Promise<void> {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true },
  });
  if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");
}

function sseSend(res: Response, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  // The compression middleware buffers; flush to push each event immediately.
  (res as Response & { flush?: () => void }).flush?.();
}

// ─────────────────────────────────────────────
// POST /api/agent/chat  (Server-Sent Events stream)
// Body: { resumeId, message }
// ─────────────────────────────────────────────

export const chat = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;
  const { resumeId, message } = req.body as {
    resumeId?: string;
    message?: string;
  };

  // Pre-flight validation (before we switch to SSE so errors are normal JSON)
  if (!resumeId || !message || !message.trim()) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_FIELD", message: "resumeId and message are required" },
    });
    return;
  }

  try {
    await ownResume(resumeId, userId);
  } catch {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Resume not found" },
    });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({
      success: false,
      error: {
        code: "AGENT_UNAVAILABLE",
        message: "Agentic mode is not configured on the server.",
      },
    });
    return;
  }

  // ── Build conversation history ──
  const history = await prisma.agentMessage.findMany({
    where: { resumeId, userId },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const priorMessages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
  priorMessages.push({ role: "user", content: message.trim() });

  // Persist the user's message immediately.
  await prisma.agentMessage.create({
    data: { resumeId, userId, role: "user", content: message.trim() },
  });

  // ── Switch to SSE ──
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // Keep-alive comment ping in case of slow first token
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
    (res as Response & { flush?: () => void }).flush?.();
  }, 15000);

  try {
    const result = await runAgent({
      resumeId,
      userId,
      turnLabel: message.trim(),
      messages: priorMessages,
      onText: (delta) => sseSend(res, { type: "text", delta }),
      onToolEvent: (event) => sseSend(res, { type: "tool", event }),
    });

    // Persist the assistant message + its tool trail.
    await prisma.agentMessage.create({
      data: {
        resumeId,
        userId,
        role: "assistant",
        content: result.text || "(no response)",
        toolEvents:
          result.toolEvents.length > 0
            ? (result.toolEvents as unknown as object)
            : undefined,
      },
    });

    if (result.mutated) {
      sseSend(res, { type: "resume_updated", resumeId });
    }

    sseSend(res, {
      type: "done",
      mutated: result.mutated,
      toolEvents: result.toolEvents,
      text: result.text,
    });
  } catch (err) {
    logger.error("Agent chat failed", { err });
    const errMessage =
      err instanceof Error
        ? err.message
        : "The assistant ran into a problem. Please try again.";
    sseSend(res, { type: "error", message: errMessage });
    // Persist an assistant turn so stored history keeps alternating roles.
    await prisma.agentMessage
      .create({
        data: {
          resumeId,
          userId,
          role: "assistant",
          content: `⚠️ ${errMessage}`,
        },
      })
      .catch(() => {});
  } finally {
    clearInterval(keepAlive);
    res.end();
  }
};

// ─────────────────────────────────────────────
// GET /api/agent/:resumeId/conversation
// ─────────────────────────────────────────────

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    await ownResume(resumeId, userId);

    const messages = await prisma.agentMessage.findMany({
      where: { resumeId, userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        toolEvents: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/agent/:resumeId/snapshots
// ─────────────────────────────────────────────

export const listSnapshots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    await ownResume(resumeId, userId);

    const snapshots = await listSnapshotsService(resumeId, userId);
    res.json({ success: true, data: { snapshots } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/agent/snapshots/:snapshotId/restore
// ─────────────────────────────────────────────

export const restoreSnapshot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const snapshotId = getParam(req, "snapshotId");
    const { resumeId } = await restoreSnapshotService(snapshotId, userId);
    res.json({ success: true, data: { resumeId } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/agent/:resumeId/undo
// ─────────────────────────────────────────────

export const undoLast = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    await ownResume(resumeId, userId);

    const result = await undoLastService(resumeId, userId);
    if (!result) {
      res.json({ success: true, data: { undone: false } });
      return;
    }
    res.json({
      success: true,
      data: { undone: true, resumeId: result.resumeId, label: result.label },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/agent/:resumeId/artifacts
// ─────────────────────────────────────────────

export const listArtifacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    await ownResume(resumeId, userId);

    const artifacts = await prisma.artifact.findMany({
      where: { resumeId, userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        kind: true,
        label: true,
        mimeType: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { artifacts } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/agent/:resumeId/artifacts  (multipart file)
// ─────────────────────────────────────────────

export const uploadArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    await ownResume(resumeId, userId);

    const file = req.file;
    if (!file) throw new AppError("No file uploaded", 400, "MISSING_FILE");

    const text = await extractText(file.buffer, file.mimetype);
    if (!text || !text.trim()) {
      throw new AppError(
        "Could not extract any text from that file.",
        422,
        "EMPTY_FILE"
      );
    }

    const artifact = await prisma.artifact.create({
      data: {
        resumeId,
        userId,
        kind: "FILE",
        label: file.originalname,
        mimeType: file.mimetype,
        text: text.slice(0, 20000),
      },
      select: { id: true, kind: true, label: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: { artifact } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/agent/:resumeId/job-description
// Body: { text, label? }
// ─────────────────────────────────────────────

export const addJobDescription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    await ownResume(resumeId, userId);

    const { text, label } = req.body as { text?: string; label?: string };
    if (!text || !text.trim()) {
      throw new AppError("Job description text is required", 400, "MISSING_FIELD");
    }

    const artifact = await prisma.artifact.create({
      data: {
        resumeId,
        userId,
        kind: "JD",
        label: label?.trim() || "Job Description",
        text: text.trim().slice(0, 20000),
      },
      select: { id: true, kind: true, label: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: { artifact } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/agent/:resumeId/artifacts/:artifactId
// ─────────────────────────────────────────────

export const deleteArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const resumeId = getParam(req, "resumeId");
    const artifactId = getParam(req, "artifactId");

    const artifact = await prisma.artifact.findFirst({
      where: { id: artifactId, resumeId, userId },
    });
    if (!artifact) throw new AppError("Artifact not found", 404, "NOT_FOUND");

    await prisma.artifact.delete({ where: { id: artifactId } });
    res.json({ success: true, message: "Artifact removed" });
  } catch (err) {
    next(err);
  }
};
