// SHARED TYPE DEFINTAIONS

import { Request, Response, NextFunction } from "express";

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface StoredOtp {
  hash: string;
  attempts: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
}