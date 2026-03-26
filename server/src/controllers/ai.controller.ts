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
    const { resumeId, data } = req.body as {
      resumeId?: string;
      data?: {
        stream?: string;
        university?: string;
        skills?: string[];
        projects?: { title: string }[];
        internships?: { role: string; company: string }[];
      };
    };

    if (!resumeId && !data) {
      throw new AppError(
        "resumeId is required (or provide data)",
        400,
        "MISSING_FIELD"
      );
    }

    // Only hit DB if we need it for defaults / persistence.
    // When we don't provide `data`, we still need relations for summary generation.
    const resume = resumeId
      ? await prisma.resume.findFirst({
          where: { id: resumeId, userId },
          include: { projects: true, internships: true },
        })
      : null;

    if (resumeId && !resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    const liveData = {
      stream: data?.stream ?? (resume?.stream ?? ""),
      university: data?.university ?? (resume?.university ?? ""),
      skills: Array.isArray(data?.skills)
        ? data!.skills.filter((s) => typeof s === "string")
        : (resume?.skills ?? []),
      projects: Array.isArray(data?.projects)
        ? data!.projects
            .filter((p) => p && typeof p.title === "string")
            .map((p) => ({ title: p.title }))
        : (resume?.projects ?? []).map((p) => ({ title: p.title })),
      internships: Array.isArray(data?.internships)
        ? data!.internships
            .filter(
              (i) =>
                i &&
                typeof i.role === "string" &&
                typeof i.company === "string"
            )
            .map((i) => ({ role: i.role, company: i.company }))
        : (resume?.internships ?? []).map((i) => ({
            role: i.role,
            company: i.company,
          })),
    };

    // If live data was provided (from the UI), cache by the input hash so
    // "Generate with AI" reflects your current unsaved edits.
    // Otherwise, fall back to the old "resume.version" caching scheme.
    let cacheKey: string;
    if (data) {
      const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(liveData))
        .digest("hex")
        .slice(0, 20);
      cacheKey = `ai:summary:${resumeId ?? "live"}:hash:${hash}`;
    } else {
      // @ts-expect-error - resume is defined when data is not provided
      cacheKey = `ai:summary:${resumeId}:v${resume.version}`;
    }

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: { summary: cached } });
      return;
    }

    const summary = await generateSummaryService(liveData);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, summary);

    // Persist to DB so it survives cache eviction.
    if (resumeId) {
      await prisma.resume.update({
        where: { id: resumeId },
        data: { aiGeneratedSummary: summary },
      });
    }

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