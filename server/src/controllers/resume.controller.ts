import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// POST /api/resume
// Create a new empty resume for the logged-in user
// ─────────────────────────────────────────────

export const createResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Check if user already has a draft resume
    const existing = await prisma.resume.findFirst({
      where: { userId, status: "DRAFT" },
    });

    if (existing) {
      // Return the existing draft instead of creating a new one
      res.json({
        success: true,
        data: { resume: existing },
        message: "Existing draft resume found",
      });
      return;
    }

    const resume = await prisma.resume.create({
      data: {
        userId,
        contactEmail: req.user!.email,
      },
    });

    logger.info("Resume created", { userId, resumeId: resume.id });

    res.status(201).json({
      success: true,
      data: { resume },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/resume/:id
// Get full resume with all relations
// ─────────────────────────────────────────────

export const getResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");

    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        projects: { orderBy: { sortOrder: "asc" } },
        internships: { orderBy: { sortOrder: "asc" } },
        achievements: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!resume) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    if (resume.userId !== userId) {
      throw new AppError("Not authorized to view this resume", 403, "FORBIDDEN");
    }

    res.json({ success: true, data: { resume } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/resume/me
// Get current user's active resume (latest draft or completed)
// ─────────────────────────────────────────────

export const getMyResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        projects: { orderBy: { sortOrder: "asc" } },
        internships: { orderBy: { sortOrder: "asc" } },
        achievements: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!resume) {
      res.json({ success: true, data: { resume: null } });
      return;
    }

    res.json({ success: true, data: { resume } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/resume/:id/step/1  — Personal Details
// ─────────────────────────────────────────────

export const saveStep1 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { version, ...data } = req.body;

    const {
      fullName,
      dateOfBirth,
      phone,
      contactEmail,
      city,
      state,
      linkedin,
      github,
      portfolio,
    } = data;

    const updated = await prisma.resume.updateMany({
      where: { id, userId, version: version ?? undefined },
      data: {
        fullName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone,
        contactEmail,
        city,
        state,
        linkedin,
        github,
        portfolio,
        currentStep: Math.max(1, data.currentStep ?? 1),
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new AppError(
        "Resume not found or was modified elsewhere. Please refresh.",
        409,
        "VERSION_CONFLICT"
      );
    }

    res.json({ success: true, message: "Step 1 saved" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/resume/:id/step/2  — Academic Details
// ─────────────────────────────────────────────

export const saveStep2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { version, ...data } = req.body;

    const {
      university,
      stream,
      branch,
      batchStart,
      batchEnd,
      cgpa,
      marks12th,
      board12th,
      marks10th,
      board10th,
      coursework,
    } = data;

    const updated = await prisma.resume.updateMany({
      where: { id, userId, version: version ?? undefined },
      data: {
        university,
        stream,
        branch,
        batchStart: batchStart ? parseInt(batchStart) : null,
        batchEnd: batchEnd ? parseInt(batchEnd) : null,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        marks12th: marks12th ? parseFloat(marks12th) : null,
        board12th,
        marks10th: marks10th ? parseFloat(marks10th) : null,
        board10th,
        coursework: coursework ?? [],
        currentStep: Math.max(2, data.currentStep ?? 2),
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new AppError(
        "Resume not found or was modified elsewhere. Please refresh.",
        409,
        "VERSION_CONFLICT"
      );
    }

    res.json({ success: true, message: "Step 2 saved" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/resume/:id/step/3  — Skills & Projects
// ─────────────────────────────────────────────

export const saveStep3 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { version, skills, projects } = req.body;

    // Verify ownership
    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    if (version && resume.version !== version) {
      throw new AppError(
        "Resume was modified elsewhere. Please refresh.",
        409,
        "VERSION_CONFLICT"
      );
    }

    // Use a transaction to update skills + replace projects atomically
    await prisma.$transaction(async (tx) => {
      // Update skills on resume
      await tx.resume.update({
        where: { id },
        data: {
          skills: skills ?? [],
          currentStep: Math.max(3, resume.currentStep),
          version: { increment: 1 },
        },
      });

      // Delete existing projects and recreate
      await tx.project.deleteMany({ where: { resumeId: id } });

      if (projects && projects.length > 0) {
        await tx.project.createMany({
          data: projects.map(
            (
              p: {
                title: string;
                description: string;
                techStack?: string[];
                liveUrl?: string;
                repoUrl?: string;
                startDate?: string;
                endDate?: string;
              },
              index: number
            ) => ({
              resumeId: id,
              title: p.title,
              description: p.description,
              techStack: p.techStack ?? [],
              liveUrl: p.liveUrl || null,
              repoUrl: p.repoUrl || null,
              startDate: p.startDate ? new Date(p.startDate) : null,
              endDate: p.endDate ? new Date(p.endDate) : null,
              sortOrder: index,
            })
          ),
        });
      }
    });

    res.json({ success: true, message: "Step 3 saved" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/resume/:id/step/4  — Experience & Achievements
// ─────────────────────────────────────────────

export const saveStep4 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { version, internships, achievements } = req.body;

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    if (version && resume.version !== version) {
      throw new AppError(
        "Resume was modified elsewhere. Please refresh.",
        409,
        "VERSION_CONFLICT"
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.resume.update({
        where: { id },
        data: {
          currentStep: Math.max(4, resume.currentStep),
          version: { increment: 1 },
        },
      });

      // Replace internships
      await tx.internship.deleteMany({ where: { resumeId: id } });

      if (internships && internships.length > 0) {
        await tx.internship.createMany({
          data: internships.map(
            (
              i: {
                company: string;
                role: string;
                description?: string;
                startDate?: string;
                endDate?: string;
              },
              index: number
            ) => ({
              resumeId: id,
              company: i.company,
              role: i.role,
              description: i.description || "",
              startDate: i.startDate ? new Date(i.startDate) : null,
              endDate: i.endDate ? new Date(i.endDate) : null,
              sortOrder: index,
            })
          ),
        });
      }

      // Replace achievements
      await tx.achievement.deleteMany({ where: { resumeId: id } });

      if (achievements && achievements.length > 0) {
        await tx.achievement.createMany({
          data: achievements.map(
            (
              a: {
                title: string;
                description?: string;
                type?: string;
              },
              index: number
            ) => ({
              resumeId: id,
              title: a.title,
              description: a.description || null,
              type: (a.type as any) || "OTHER",
              sortOrder: index,
            })
          ),
        });
      }
    });

    res.json({ success: true, message: "Step 4 saved" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/resume/:id/step/5  — Summary & Hobbies
// ─────────────────────────────────────────────

export const saveStep5 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { version, summary, hobbies } = req.body;

    const updated = await prisma.resume.updateMany({
      where: { id, userId, version: version ?? undefined },
      data: {
        summary,
        hobbies: hobbies ?? [],
        currentStep: 5,
        status: "COMPLETED",
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new AppError(
        "Resume not found or was modified elsewhere. Please refresh.",
        409,
        "VERSION_CONFLICT"
      );
    }

    res.json({ success: true, message: "Step 5 saved. Resume completed!" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PUT /api/resume/:id/template
// Set selected template
// ─────────────────────────────────────────────

export const setTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { template } = req.body;

    const validTemplates = [
      "CLASSIC",
      "MODERN",
      "MINIMAL",
      "ACADEMIC",
      "TECHNICAL",
    ];

    if (!validTemplates.includes(template)) {
      throw new AppError(
        `Invalid template. Must be one of: ${validTemplates.join(", ")}`,
        400,
        "INVALID_TEMPLATE"
      );
    }

    const updated = await prisma.resume.updateMany({
      where: { id, userId },
      data: { selectedTemplate: template },
    });

    if (updated.count === 0) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    res.json({ success: true, message: `Template set to ${template}` });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/resume/:id
// Delete a resume and all related data (cascade)
// ─────────────────────────────────────────────

export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    await prisma.resume.delete({ where: { id } });

    logger.info("Resume deleted", { userId, resumeId: id });

    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    next(err);
  }
};