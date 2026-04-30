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
        projects: {
          orderBy: { sortOrder: "asc" },
          include: { bullets: { orderBy: { sortOrder: "asc" } } },
        },
        internships: {
          orderBy: { sortOrder: "asc" },
          include: { bullets: { orderBy: { sortOrder: "asc" } } },
        },
        achievements: { orderBy: { sortOrder: "asc" } },
        skillCategories: { orderBy: { sortOrder: "asc" } },
        hobbyItems: { orderBy: { sortOrder: "asc" } },
        customSections: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
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
        projects: {
          orderBy: { sortOrder: "asc" },
          include: { bullets: { orderBy: { sortOrder: "asc" } } },
        },
        internships: {
          orderBy: { sortOrder: "asc" },
          include: { bullets: { orderBy: { sortOrder: "asc" } } },
        },
        achievements: { orderBy: { sortOrder: "asc" } },
        skillCategories: { orderBy: { sortOrder: "asc" } },
        hobbyItems: { orderBy: { sortOrder: "asc" } },
        customSections: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
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
      schoolName10th,
      schoolName12th,
      coursework,
      showCoursework,
      showMarks10th,
      showMarks12th,
    } = data;

    // Console log is guaranteed to show up even if winston config changes.
    console.log(
      `saveStep2 academic school names: resumeId=${id} schoolName10th=${
        schoolName10th ?? "null"
      } schoolName12th=${schoolName12th ?? "null"}`
    );
    logger.info(
      `saveStep2 academic school names: resumeId=${id} schoolName10th=${
        schoolName10th ?? "null"
      } schoolName12th=${schoolName12th ?? "null"}`
    );

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
        schoolName12th: schoolName12th || null,
        schoolName10th: schoolName10th || null,
        coursework: coursework ?? [],
        showCoursework: showCoursework ?? true,
        showMarks10th: showMarks10th ?? true,
        showMarks12th: showMarks12th ?? true,
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
    const { version, skillCategories, projects } = req.body;

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
      // Flatten skill categories into legacy skills[] for backward compat
      const flatSkills: string[] = [];
      if (Array.isArray(skillCategories)) {
        for (const cat of skillCategories) {
          if (Array.isArray(cat.skills)) flatSkills.push(...cat.skills);
        }
      }

      await tx.resume.update({
        where: { id },
        data: {
          skills: flatSkills,
          currentStep: Math.max(3, resume.currentStep),
          version: { increment: 1 },
        },
      });

      // Replace skill categories
      await tx.skillCategory.deleteMany({ where: { resumeId: id } });
      if (Array.isArray(skillCategories) && skillCategories.length > 0) {
        await tx.skillCategory.createMany({
          data: skillCategories.map(
            (cat: { name: string; skills?: string[] }, i: number) => ({
              resumeId: id,
              name: cat.name,
              skills: cat.skills ?? [],
              sortOrder: i,
            })
          ),
        });
      }

      // Replace projects (with nested bullets)
      await tx.projectBullet.deleteMany({
        where: { project: { resumeId: id } },
      });
      await tx.project.deleteMany({ where: { resumeId: id } });

      if (projects && projects.length > 0) {
        for (let i = 0; i < projects.length; i++) {
          const p = projects[i] as {
            title: string;
            subtitle?: string;
            description?: string;
            techStack?: string[];
            liveUrl?: string;
            repoUrl?: string;
            startDate?: string;
            endDate?: string;
            bullets?: { text: string }[];
          };

          const project = await tx.project.create({
            data: {
              resumeId: id,
              title: p.title,
              subtitle: p.subtitle || null,
              description: p.description || "",
              techStack: p.techStack ?? [],
              liveUrl: p.liveUrl || null,
              repoUrl: p.repoUrl || null,
              startDate: p.startDate ? new Date(p.startDate) : null,
              endDate: p.endDate ? new Date(p.endDate) : null,
              sortOrder: i,
            },
          });

          if (Array.isArray(p.bullets) && p.bullets.length > 0) {
            await tx.projectBullet.createMany({
              data: p.bullets.map((b, bi) => ({
                projectId: project.id,
                text: b.text,
                sortOrder: bi,
              })),
            });
          }
        }
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

      // Replace internships (with nested bullets)
      await tx.internshipBullet.deleteMany({
        where: { internship: { resumeId: id } },
      });
      await tx.internship.deleteMany({ where: { resumeId: id } });

      if (internships && internships.length > 0) {
        for (let i = 0; i < internships.length; i++) {
          const inp = internships[i] as {
            company: string;
            role: string;
            description?: string;
            startDate?: string;
            endDate?: string;
            bullets?: { text: string }[];
          };

          const internship = await tx.internship.create({
            data: {
              resumeId: id,
              company: inp.company,
              role: inp.role,
              description: inp.description || "",
              startDate: inp.startDate ? new Date(inp.startDate) : null,
              endDate: inp.endDate ? new Date(inp.endDate) : null,
              sortOrder: i,
            },
          });

          if (Array.isArray(inp.bullets) && inp.bullets.length > 0) {
            await tx.internshipBullet.createMany({
              data: inp.bullets.map((b, bi) => ({
                internshipId: internship.id,
                text: b.text,
                sortOrder: bi,
              })),
            });
          }
        }
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
                link?: string;
                type?: string;
              },
              index: number
            ) => ({
              resumeId: id,
              title: a.title,
              description: a.description || null,
              link: a.link || null,
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
    const { version, summary, hobbyItems, markComplete } = req.body as {
      version?: number;
      summary?: string;
      hobbyItems?: { name: string; description?: string }[];
      markComplete?: boolean;
    };

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
      // Keep legacy hobbies[] in sync
      const legacyHobbies: string[] = Array.isArray(hobbyItems)
        ? hobbyItems.map((h: { name: string }) => h.name)
        : [];

      const completed = markComplete === true;
      await tx.resume.update({
        where: { id },
        data: {
          summary,
          hobbies: legacyHobbies,
          currentStep: 5,
          ...(completed ? { status: "COMPLETED" as const } : {}),
          version: { increment: 1 },
        },
      });

      // Replace hobby items
      await tx.hobby.deleteMany({ where: { resumeId: id } });
      if (Array.isArray(hobbyItems) && hobbyItems.length > 0) {
        await tx.hobby.createMany({
          data: hobbyItems.map(
            (h: { name: string; description?: string }, i: number) => ({
              resumeId: id,
              name: h.name,
              description: h.description || null,
              sortOrder: i,
            })
          ),
        });
      }
    });

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
      "COMPACT",
      "ELEGANT",
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
// PUT /api/resume/:id/sections/order
// Reorder sections and/or update section titles (custom labels)
// Body: { sectionOrder?: string[], sectionTitles?: Record<string, string> }
// ─────────────────────────────────────────────

export const updateSectionOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { sectionOrder, sectionTitles } = req.body;

    const data: Record<string, unknown> = {};
    if (sectionOrder !== undefined) data.sectionOrder = sectionOrder;
    if (sectionTitles !== undefined && typeof sectionTitles === "object") data.sectionTitles = sectionTitles;

    if (Object.keys(data).length === 0) {
      res.json({ success: true, message: "Nothing to update" });
      return;
    }

    const updated = await prisma.resume.updateMany({
      where: { id, userId },
      data,
    });

    if (updated.count === 0) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    res.json({ success: true, message: "Sections updated" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PUT /api/resume/:id/styles
// Update font, color, spacing settings
// ─────────────────────────────────────────────

export const updateStyles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { fontFamily, fontSize, headingSize, accentColor, lineSpacing, marginSize, sectionDivider } = req.body;

    const data: Record<string, unknown> = {};
    if (fontFamily !== undefined) data.fontFamily = fontFamily;
    if (fontSize !== undefined) data.fontSize = parseInt(fontSize);
    if (headingSize !== undefined) data.headingSize = parseInt(headingSize);
    if (accentColor !== undefined) data.accentColor = accentColor;
    if (lineSpacing !== undefined) data.lineSpacing = parseFloat(lineSpacing);
    if (marginSize !== undefined) data.marginSize = marginSize;
    if (sectionDivider !== undefined) data.sectionDivider = sectionDivider;

    const updated = await prisma.resume.updateMany({
      where: { id, userId },
      data,
    });

    if (updated.count === 0) {
      throw new AppError("Resume not found", 404, "NOT_FOUND");
    }

    res.json({ success: true, message: "Styles updated" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/resume/:id/sections/custom
// Create a custom section
// ─────────────────────────────────────────────

export const createCustomSection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { title, items } = req.body;

    const resume = await prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    const existing = await prisma.customSection.count({ where: { resumeId: id } });

    const section = await prisma.customSection.create({
      data: {
        resumeId: id,
        title: title || "Custom Section",
        sortOrder: existing,
        items: items && items.length > 0
          ? {
              create: items.map((item: { text: string }, i: number) => ({
                text: item.text,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    res.status(201).json({ success: true, data: { section } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/resume/:id/sections/custom/:sId
// Update a custom section
// ─────────────────────────────────────────────

export const updateCustomSection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const sId = String(req.params.sId);
    const { title, items } = req.body;

    const resume = await prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    await prisma.$transaction(async (tx) => {
      if (title !== undefined) {
        await tx.customSection.update({
          where: { id: sId },
          data: { title },
        });
      }

      if (Array.isArray(items)) {
        await tx.customSectionItem.deleteMany({ where: { sectionId: sId } });
        if (items.length > 0) {
          await tx.customSectionItem.createMany({
            data: items.map((item: { text: string }, i: number) => ({
              sectionId: sId,
              text: item.text,
              sortOrder: i,
            })),
          });
        }
      }
    });

    const section = await prisma.customSection.findUnique({
      where: { id: sId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    res.json({ success: true, data: { section } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/resume/:id/sections/custom/:sId
// Delete a custom section
// ─────────────────────────────────────────────

export const deleteCustomSection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const sId = req.params.sId;

    const resume = await prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    await prisma.customSection.delete({ where: { id: String(sId) } });

    res.json({ success: true, message: "Custom section deleted" });
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