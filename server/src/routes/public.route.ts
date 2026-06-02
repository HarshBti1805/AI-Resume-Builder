import { Router } from "express";
import { getPublicResume } from "../controllers/public.controller";

// Public, unauthenticated routes (read-only shared resumes).
const router = Router();

router.get("/resume/:shareId", getPublicResume);

export default router;
