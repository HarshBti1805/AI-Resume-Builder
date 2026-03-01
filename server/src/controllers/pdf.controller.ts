import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import { renderTemplate } from "../services/template.service";
import { generatePdf } from "../services/pdf.service";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// POST /api/resume/:id/download
// Renders template → Puppeteer PDF → streams to client
// ─────────────────────────────────────────────

export const downloadPdf = async (
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
    const pdfBuffer = await generatePdf(html);

    // Safe filename from student's name
    const safeName = (resume.fullName ?? "resume")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const filename = `${safeName}_resume.pdf`;

    logger.info("PDF generated", { userId, resumeId: id, template: templateName });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};