import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { env } from "../config/env";
import { storeOtp, verifyOtp, deleteOtp } from "../services/otp.service";
import { sendOtpEmail } from "../services/email.service";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

// Cookie attributes for the auth tokens.
// In production the client (Vercel) and API (Render) are on different sites, so
// the cookies must be SameSite=None + Secure to survive cross-site requests.
// Locally (same-site localhost) we use Lax so cookies work over plain HTTP.
const isProd = env.NODE_ENV === "production";
const authCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
} as const;

// ─────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { email: string }
// ─────────────────────────────────────────────

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body as { email: string };

    // Validate university email domain
    const domain = email.split("@")[1];
    if (domain !== env.ALLOWED_EMAIL_DOMAIN) {
      throw new AppError(
        `Only @${env.ALLOWED_EMAIL_DOMAIN} emails are allowed`,
        400,
        "INVALID_DOMAIN",
      );
    }

    // Generate OTP, hash it, store in Redis
    const otp = await storeOtp(email);

    // Send OTP via email
    await sendOtpEmail(email, otp);

    logger.info("OTP sent", { email });

    res.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { email, otp, name, rollNumber }
// ─────────────────────────────────────────────

export const verifyOtpAndLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp, name, rollNumber } = req.body as {
      email: string;
      otp: string;
      name: string;
      rollNumber: string;
    };

    // Verify OTP against Redis
    await verifyOtp(email, otp);

    // Upsert user — create if first time, update if returning
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        rollNumber,
        isVerified: true,
        lastLogin: new Date(),
      },
      create: {
        email,
        name,
        rollNumber,
        isVerified: true,
        lastLogin: new Date(),
      },
    });

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn:
          env.JWT_ACCESS_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"],
      },
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn:
          env.JWT_REFRESH_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"],
      },
    );

    // Set httpOnly cookies (session is cookie-based; Redis is used for OTP only)
    const ACCESS_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h — align with JWT_ACCESS_EXPIRES_IN
    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    });

    res.cookie("refreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info("User logged in", { userId: user.id, email: user.email });

    // Invalidate OTP now that login succeeded (one-time use)
    await deleteOtp(email);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          rollNumber: user.rollNumber,
        },
        // Also returned in the body so cross-domain clients (Vercel client +
        // Render API) can use Bearer auth, since third-party cookies are
        // unreliable / blocked across different registrable domains.
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// Reads refreshToken from cookie
// ─────────────────────────────────────────────

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Accept the refresh token from the request body (Bearer/localStorage
    // clients) or the cookie (same-domain clients).
    const token =
      (req.body?.refreshToken as string | undefined) ||
      req.cookies?.refreshToken;

    if (!token) {
      throw new AppError("No refresh token provided", 401, "NO_REFRESH_TOKEN");
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError("User not found", 401, "USER_NOT_FOUND");
    }

    // Issue new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );

    // Issue new access token (cookie TTL aligned with JWT)
    const ACCESS_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    });

    res.json({
      success: true,
      message: "Token refreshed",
      data: { accessToken },
    });
  } catch (err) {
    // If JWT verification fails, clear cookies and force re-login
    if (err instanceof jwt.JsonWebTokenError) {
      res.clearCookie("accessToken", authCookieOptions);
      res.clearCookie("refreshToken", authCookieOptions);
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid refresh token. Please login again.",
        },
      });
      return;
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/logout
// Clears both cookies
// ─────────────────────────────────────────────

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie("accessToken", authCookieOptions);
  res.clearCookie("refreshToken", authCookieOptions);
  res.json({ success: true, message: "Logged out successfully" });
};

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns current user from JWT (protected route)
// ─────────────────────────────────────────────

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Not authenticated", 401, "UNAUTHORIZED");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        rollNumber: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
