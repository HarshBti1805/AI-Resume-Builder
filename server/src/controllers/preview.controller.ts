import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import { renderTemplate } from "../services/template.service";

const VALID_TEMPLATES = ["CLASSIC", "MODERN", "MINIMAL", "ACADEMIC", "TECHNICAL"];

// ─────────────────────────────────────────────
// GET /api/resume/:id/preview
// Returns rendered HTML for the selected template
// ─────────────────────────────────────────────

export const getPreview = async (
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

    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");
    if (resume.userId !== userId)
      throw new AppError("Not authorized", 403, "FORBIDDEN");

    const templateName = resume.selectedTemplate ?? "CLASSIC";
    const html = await renderTemplate(templateName, resume);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/resume/preview-live
// Renders a template from request body data (no DB read).
// Used by the live preview panel during form editing.
// ─────────────────────────────────────────────

export const postPreviewLive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { template, data } = req.body;

    const templateName = VALID_TEMPLATES.includes(template) ? template : "CLASSIC";

    const html = await renderTemplate(templateName, data ?? {});

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    next(err);
  }
};