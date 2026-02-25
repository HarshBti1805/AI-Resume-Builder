import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { uploadPhoto, deletePhoto } from "../controllers/upload.controller";

const router = Router();

router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

router.post("/photo", upload.single("photo"), uploadPhoto);
router.delete("/photo/:key", deletePhoto);

export default router;