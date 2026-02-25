import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers["x-request-id"],
  });

  // Prisma: unique constraint violation
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: "This record already exists",
      },
    });
    return;
  }

  // Prisma: record not found
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Record not found" },
    });
    return;
  }

  // Operational errors (thrown intentionally via AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unexpected errors — don't leak internals
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
};