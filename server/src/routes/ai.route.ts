import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { aiLimiter } from "../middleware/rateLimiter";
import {
  generateSummary,
  enhanceText,
  atsCheck,
  improveBullet,
  addKeywords,
  generateBullets,
  refineResume,
} from "../controllers/ai.controller";

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post("/generate-summary", generateSummary);
router.post("/enhance-text", enhanceText);
router.post("/ats-check", atsCheck);
router.post("/improve-bullet", improveBullet);
router.post("/add-keywords", addKeywords);
router.post("/generate-bullets", generateBullets);
router.post("/refine-resume", refineResume);

export default router;