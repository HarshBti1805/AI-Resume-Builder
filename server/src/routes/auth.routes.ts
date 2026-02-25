import { Router } from "express";
import { body } from "express-validator";
import {
  sendOtp,
  verifyOtpAndLogin,
  refresh,
  logout,
  getMe,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

// POST /api/auth/send-otp
router.post(
  "/send-otp",
  authLimiter,
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
  ],
  validate,
  sendOtp
);

// POST /api/auth/verify-otp
router.post(
  "/verify-otp",
  authLimiter,
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must contain only numbers"),
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("rollNumber")
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage("Roll number is required"),
  ],
  validate,
  verifyOtpAndLogin
);

// POST /api/auth/refresh
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me (protected)
router.get("/me", authenticate, getMe);

export default router;