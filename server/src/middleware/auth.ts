import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../types";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Login required" },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Session expired. Please refresh." },
    });
  }
};