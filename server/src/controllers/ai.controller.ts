import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import prisma from "../config/prisma";
import redis from "../config/redis";
import { AppError } from "../utils/AppError";
import {
  generateSummaryService,
  enhanceBulletService,
  improveBulletService,
  addKeywordsService,
  generateBulletsService,
  refineFullResumeService,
} from "../services/ai.service";
import { atsCheckService } from "../services/ats.service";

// ─────────────────────────────────────────────
// POST /api/ai/generate-summary
// ─────────────────────────────────────────────

export const generateSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.body;

    if (!resumeId) throw new AppError("resumeId is required", 400, "MISSING_FIELD");

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: { projects: true, internships: true },
    });

    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    // Cache key tied to resume version — invalidates automatically on edits
    const cacheKey = `ai:summary:${resumeId}:v${resume.version}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: { summary: cached } });
      return;
    }

    const summary = await generateSummaryService({
      stream: resume.stream ?? "",
      university: resume.university ?? "",
      skills: resume.skills,
      projects: resume.projects,
      internships: resume.internships,
    });

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, summary);

    // Persist to DB so it survives cache eviction
    await prisma.resume.update({
      where: { id: resumeId },
      data: { aiGeneratedSummary: summary },
    });

    res.json({ success: true, data: { summary } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/enhance-text
// ─────────────────────────────────────────────

export const enhanceText = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, context } = req.body;

    if (!text || typeof text !== "string") {
      throw new AppError("text is required", 400, "MISSING_FIELD");
    }

    // Cache by hash of (text + context) so identical inputs reuse the result
    const hash = crypto
      .createHash("sha256")
      .update(`${text}::${context ?? ""}`)
      .digest("hex")
      .slice(0, 20);
    const cacheKey = `ai:enhance:${hash}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: { enhanced: cached } });
      return;
    }

    const enhanced = await enhanceBulletService(text, context ?? "");
    await redis.setex(cacheKey, 3600, enhanced);

    res.json({ success: true, data: { enhanced } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/ats-check
// ─────────────────────────────────────────────

export const atsCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.body;

    if (!resumeId) throw new AppError("resumeId is required", 400, "MISSING_FIELD");

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: { projects: true },
    });

    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    const result = await atsCheckService({
      contactEmail: resume.contactEmail,
      phone: resume.phone,
      fullName: resume.fullName,
      cgpa: resume.cgpa,
      skills: resume.skills,
      summary: resume.summary,
      projects: resume.projects.map((p) => ({
        title: p.title,
        description: p.description,
      })),
    });

    // Persist score so it shows in the UI without re-running
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        atsScore: Math.round(result.total),
        lastAtsCheck: new Date(),
      },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/improve-bullet
// ─────────────────────────────────────────────

export const improveBullet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bullet, context } = req.body;
    if (!bullet || typeof bullet !== "string") {
      throw new AppError("bullet is required", 400, "MISSING_FIELD");
    }

    const hash = crypto
      .createHash("sha256")
      .update(`improve:${bullet}::${context ?? ""}`)
      .digest("hex")
      .slice(0, 20);
    const cacheKey = `ai:improve:${hash}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: { improved: cached } });
      return;
    }

    const improved = await improveBulletService(bullet, context ?? "");
    await redis.setex(cacheKey, 3600, improved);

    res.json({ success: true, data: { improved } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/add-keywords
// ─────────────────────────────────────────────

export const addKeywords = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bullet, context } = req.body;
    if (!bullet || typeof bullet !== "string") {
      throw new AppError("bullet is required", 400, "MISSING_FIELD");
    }

    const result = await addKeywordsService(bullet, context ?? "");
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/generate-bullets
// ─────────────────────────────────────────────

export const generateBullets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { description, techStack, count } = req.body;
    if (!description || typeof description !== "string") {
      throw new AppError("description is required", 400, "MISSING_FIELD");
    }

    const bullets = await generateBulletsService(
      description,
      techStack ?? [],
      count ?? 4
    );
    res.json({ success: true, data: { bullets } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/refine-resume
// ─────────────────────────────────────────────

export const refineResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.body;

    if (!resumeId) throw new AppError("resumeId is required", 400, "MISSING_FIELD");

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: { projects: true, internships: true, achievements: true },
    });

    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    const result = await refineFullResumeService({
      stream: resume.stream ?? "",
      university: resume.university ?? "",
      skills: resume.skills,
      projects: resume.projects.map((p) => ({ title: p.title })),
      internships: resume.internships.map((i) => ({
        role: i.role,
        company: i.company,
      })),
      summary: resume.summary ?? "",
      achievements: resume.achievements.map((a) => ({ title: a.title })),
    });

    if (result.score > 0) {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          atsScore: Math.round(result.score),
          lastAtsCheck: new Date(),
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};