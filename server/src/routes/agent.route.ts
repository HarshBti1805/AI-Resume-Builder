import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { aiLimiter } from "../middleware/rateLimiter";
import {
  chat,
  getConversation,
  listSnapshots,
  restoreSnapshot,
  undoLast,
  listArtifacts,
  uploadArtifact,
  addJobDescription,
  deleteArtifact,
} from "../controllers/agent.controller";

const router = Router();

router.use(authenticate);

const artifactUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOCX, TXT and MD files are allowed"));
    }
    cb(null, true);
  },
});

// ── Chat (SSE) ──
router.post("/chat", aiLimiter, chat);

// ── History / rollback ──
router.post("/snapshots/:snapshotId/restore", restoreSnapshot);
router.get("/:resumeId/snapshots", listSnapshots);
router.post("/:resumeId/undo", undoLast);
router.get("/:resumeId/conversation", getConversation);

// ── Artifacts ──
router.get("/:resumeId/artifacts", listArtifacts);
router.post(
  "/:resumeId/artifacts",
  artifactUpload.single("file"),
  uploadArtifact
);
router.delete("/:resumeId/artifacts/:artifactId", deleteArtifact);
router.post("/:resumeId/job-description", addJobDescription);

export default router;
