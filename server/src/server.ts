import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";

import { env } from "./config/env";
import prisma from "./config/prisma";
import redis from "./config/redis"
import logger from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";

// Routes
import authRoutes from "./routes/auth.routes";


const app = express();

// ─── Global Middleware ────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Required for httpOnly cookies
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));
app.use(generalLimiter);

// ─── Health Check ─────────────────────────────
app.get("/health", async (_req, res) => {
  const checks = {
    server: "ok" as const,
    postgres: await prisma
      .$queryRaw`SELECT 1`
      .then(() => "ok" as const)
      .catch(() => "down" as const),
    redis: await redis
      .ping()
      .then(() => "ok" as const)
      .catch(() => "down" as const),
    timestamp: new Date(),
  };

  const healthy = checks.postgres === "ok" && checks.redis === "ok";
  res.status(healthy ? 200 : 503).json(checks);
});

// ─── API Routes ───────────────────────────────
app.use("/api/auth", authRoutes);
// app.use("/api/resume", resumeRoutes);   // Add when ready
// app.use("/api/ai", aiRoutes);           // Add when ready
// app.use("/api/upload", uploadRoutes);   // Add when ready

// ─── 404 Handler ──────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ─── Global Error Handler ─────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────
const PORT = parseInt(env.PORT);

const server = app.listen(PORT, () => {
  logger.info(`🚀 ChitkaraCV API running on port ${PORT}`);
  logger.info(`📍 Environment: ${env.NODE_ENV}`);
});

// ─── Graceful Shutdown ────────────────────────
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close();
  await prisma.$disconnect();
  await redis.quit();

  logger.info("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;