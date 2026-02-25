import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { env } from "../config/env";
import { storeOtp, verifyOtp } from "../services/otp.service";
import { sendOtpEmail } from "../services/email.service";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { email: string }
// ─────────────────────────────────────────────

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as { email: string };

    // Validate university email domain
    const domain = email.split("@")[1];
    if (domain !== env.ALLOWED_EMAIL_DOMAIN) {
      throw new AppError(
        `Only @${env.ALLOWED_EMAIL_DOMAIN} emails are allowed`,
        400,
        "INVALID_DOMAIN"
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
  next: NextFunction
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
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"] }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"] }
    );

    // Set httpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info("User logged in", { userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          rollNumber: user.rollNumber,
        },
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
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

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
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ success: true, message: "Token refreshed" });
  } catch (err) {
    // If JWT verification fails, clear cookies and force re-login
    if (err instanceof jwt.JsonWebTokenError) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
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

export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully" });
};

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns current user from JWT (protected route)
// ─────────────────────────────────────────────

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
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