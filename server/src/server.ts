import "./config/env"; // validate env vars before anything else

import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

import { generalLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

import authRoutes from "./routes/auth.routes";
import resumeRoutes from "./routes/resume.route";
import aiRoutes from "./routes/ai.route";
import uploadRoutes from "./routes/upload.route";

import prisma from "./config/prisma";
import redis from "./config/redis";
import { drainBrowserPool } from "./services/pdf.service";
import logger from "./utils/logger";

const app = express();

// ─────────────────────────────────────────────
// Global middleware
// ─────────────────────────────────────────────

app.use(helmet());
const allowedOrigins = [
  env.CLIENT_URL,
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
    : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(requestLogger);
app.use(generalLimiter);

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

app.get("/health", async (_req: Request, res: Response) => {
  const [pgOk, redisOk] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    redis.ping().then(() => true).catch(() => false),
  ]);

  const healthy = pgOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    server: "ok",
    postgres: pgOk ? "ok" : "down",
    redis: redisOk ? "ok" : "down",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);

// ─────────────────────────────────────────────
// 404 fallthrough
// ─────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ─────────────────────────────────────────────
// Global error handler (must be last)
// ─────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 4000);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// ─────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      await redis.quit();
      await drainBrowserPool();
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { err });
      process.exit(1);
    }
  });

  // Force exit after 10 s if server.close() hangs
  setTimeout(() => {
    logger.error("Forced exit after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
});

export default app;