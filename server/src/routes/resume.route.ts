import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createResume,
  getResume,
  getMyResume,
  saveStep1,
  saveStep2,
  saveStep3,
  saveStep4,
  saveStep5,
  setTemplate,
  deleteResume,
} from "../controllers/resume.controller";
import { getPreview } from "../controllers/preview.controller";
import { downloadPdf } from "../controllers/pdf.controller";

const router = Router();

router.use(authenticate);

// ── CRUD ──────────────────────────────────────
router.post("/", createResume);
router.get("/me", getMyResume); // must be before /:id
router.get("/:id", getResume);
router.delete("/:id", deleteResume);

// ── Form steps (auto-save) ────────────────────
router.patch("/:id/step/1", saveStep1);
router.patch("/:id/step/2", saveStep2);
router.patch("/:id/step/3", saveStep3);
router.patch("/:id/step/4", saveStep4);
router.patch("/:id/step/5", saveStep5);

// ── Template & output ─────────────────────────
router.put("/:id/template", setTemplate);
router.get("/:id/preview", getPreview);
router.post("/:id/download", downloadPdf);

export default router;