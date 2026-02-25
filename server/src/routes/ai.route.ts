import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { aiLimiter } from "../middleware/rateLimiter";
import {
  generateSummary,
  enhanceText,
  atsCheck,
} from "../controllers/ai.controller";

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post("/generate-summary", generateSummary);
router.post("/enhance-text", enhanceText);
router.post("/ats-check", atsCheck);

export default router;