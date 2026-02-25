import { Request, Response, NextFunction } from "express";

/** Safely get a route param as string. Express types params as string | string[] but for :id routes it's always string. */
export function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] ?? "" : (val ?? "");
}

// Typed async controller handler
export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// JWT payload shape (from access token)
export interface JwtPayload {
  userId: string;
  email: string;
}

// OTP record stored in Redis
export interface StoredOtp {
  hash: string;      // bcrypt hash of the 6-digit OTP
  attempts: number;  // incremented on each wrong guess
}

// ATS check result returned to the client
export interface AtsResult {
  total: number;        // 0–100
  max: number;          // always 100
  issues: string[];     // things that are wrong / missing
  suggestions: string[]; // improvements the student can make
}

// Shape of the JSON the AI returns for ATS analysis
export interface AiAtsAnalysis {
  score: number;
  issues: string[];
  suggestions: string[];
}