import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { uploadPhoto, deletePhoto, uploadAndParse } from "../controllers/upload.controller";

const router = Router();

router.use(authenticate);

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF and DOCX files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/photo", photoUpload.single("photo"), uploadPhoto);
router.delete("/photo/:key", deletePhoto);
router.post("/resume-parse", resumeUpload.single("resume"), uploadAndParse);

export default router;