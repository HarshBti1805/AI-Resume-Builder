import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { getParam } from "../types";
import { uploadToS3, deleteFromS3 } from "../services/storage.service";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// POST /api/upload/photo
// ─────────────────────────────────────────────

export const uploadPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      throw new AppError("No file uploaded", 400, "MISSING_FILE");
    }

    const { resumeId } = req.body;
    if (!resumeId) throw new AppError("resumeId is required", 400, "MISSING_FIELD");

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    // Delete old photo from S3 if one exists
    if (resume.photoUrl) {
      const oldKey = extractS3Key(resume.photoUrl);
      if (oldKey) await deleteFromS3(oldKey).catch(() => {});
    }

    const ext = req.file.mimetype.split("/")[1]; // jpeg | png | webp
    const key = `photos/${userId}/${resumeId}-${Date.now()}.${ext}`;
    const url = await uploadToS3(key, req.file.buffer, req.file.mimetype);

    await prisma.resume.update({
      where: { id: resumeId },
      data: { photoUrl: url },
    });

    logger.info("Photo uploaded", { userId, resumeId, key });

    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/upload/photo/:key
// ─────────────────────────────────────────────

export const deletePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const rawKey = decodeURIComponent(getParam(req, "key"));
    const { resumeId } = req.body;

    if (!resumeId) throw new AppError("resumeId is required", 400, "MISSING_FIELD");

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");

    await deleteFromS3(rawKey);

    await prisma.resume.update({
      where: { id: resumeId },
      data: { photoUrl: null },
    });

    logger.info("Photo deleted", { userId, resumeId, key: rawKey });

    res.json({ success: true, message: "Photo deleted" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Helper — extract S3 object key from full URL
// ─────────────────────────────────────────────

function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    // AWS:   https://bucket.s3.region.amazonaws.com/key
    // MinIO: https://endpoint/bucket/key
    const parts = parsed.pathname.replace(/^\//, "").split("/");
    // For AWS the pathname IS the key; for MinIO drop the bucket prefix
    if (process.env.S3_ENDPOINT) {
      return parts.slice(1).join("/") || null; // remove bucket name
    }
    return parts.join("/") || null;
  } catch {
    return null;
  }
}