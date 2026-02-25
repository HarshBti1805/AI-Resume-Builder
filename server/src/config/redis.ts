import Redis from "ioredis";
import { env } from "./env"

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 3) {
      console.error("❌ Redis connection failed after 3 retries");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

export default redis;