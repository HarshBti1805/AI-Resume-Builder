import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import { renderTemplate } from "../services/template.service";
import { generatePdf } from "../services/pdf.service";
import { generateDocx } from "../services/docx.service";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// POST /api/resume/:id/download
// Renders template → (PDF|DOCX) → streams to client
// ─────────────────────────────────────────────

const sanitizeFileBase = (value: string): string => {
  const trimmed = (value ?? "").trim();
  const safe = trimmed.replace(/[^a-z0-9\s_-]/gi, "_").replace(/\s+/g, " ").trim();
  return safe.length > 0 ? safe : "resume";
};

export const downloadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = getParam(req, "id");
    const { format, fileName } = (req.body ?? {}) as {
      format?: "pdf" | "docx" | string;
      fileName?: string;
    };

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

    const outputFormat =
      format && String(format).toLowerCase() === "docx" ? "docx" : "pdf";

    const templateName = resume.selectedTemplate ?? "CLASSIC";
    const html = await renderTemplate(templateName, resume);

    // Default: "{Student Name} Resume"
    const defaultBase = `${resume.fullName ?? "Resume"} Resume`;
    const base = sanitizeFileBase(fileName ? fileName : defaultBase);

    const filename = `${base}.${outputFormat}`;
    const contentType =
      outputFormat === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";

    let outBuffer: Buffer;
    if (outputFormat === "docx") {
      outBuffer = await generateDocx(html);
    } else {
      outBuffer = await generatePdf(html);
    }

    logger.info("Resume exported", {
      userId,
      resumeId: id,
      template: templateName,
      format: outputFormat,
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", outBuffer.length);
    res.send(outBuffer);
  } catch (err) {
    next(err);
  }
};

// Backwards-compatible name (some older routes/components may still import it)
export const downloadPdf = downloadResume;