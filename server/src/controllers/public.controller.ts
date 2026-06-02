import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { renderTemplate } from "../services/template.service";

// ─────────────────────────────────────────────
// GET /api/public/resume/:shareId
// Read-only rendered HTML for a publicly shared resume. No auth.
// ─────────────────────────────────────────────

export const getPublicResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shareId = String(req.params.shareId ?? "");
    if (!shareId) throw new AppError("Invalid share link", 400, "BAD_REQUEST");

    const resume = await prisma.resume.findFirst({
      where: { shareId, isPublic: true },
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
      throw new AppError("Resume not found or no longer shared", 404, "NOT_FOUND");
    }

    const templateName = resume.selectedTemplate ?? "CLASSIC";
    const html = await renderTemplate(templateName, resume);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    next(err);
  }
};
