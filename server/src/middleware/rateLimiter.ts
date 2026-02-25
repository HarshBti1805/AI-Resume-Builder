import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
// import redis from "../config/redis";

// NOTE: If you have rate-limit-redis installed, uncomment the RedisStore
// lines below for production-grade shared rate limiting across PM2 clusters.
// For prototype/dev, the default in-memory store works fine.

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // store: new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) }),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many AI requests. Please wait a moment.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});