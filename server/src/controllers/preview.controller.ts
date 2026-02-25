import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import { renderTemplate } from "../services/template.service";

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
        projects: { orderBy: { sortOrder: "asc" } },
        internships: { orderBy: { sortOrder: "asc" } },
        achievements: { orderBy: { sortOrder: "asc" } },
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