import bcrypt from "bcryptjs";
import redis from "../config/redis";
import { AppError } from "../utils/AppError";
import type { StoredOtp } from "../types";

const OTP_TTL = 300; // 5 minutes
const MAX_ATTEMPTS = 3;
const LOCKOUT_TTL = 900; // 15 minutes
const RATE_LIMIT_TTL = 3600; // 1 hour
const MAX_OTP_REQUESTS = 3; // 3 OTPs per hour per email

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOtp = async (email: string): Promise<string> => {
  const key = `otp:${email}`;
  const rateKey = `otp-rate:${email}`;
  const lockKey = `otp-lock:${email}`;

  // Check if locked out from too many failed verifications
  const locked = await redis.get(lockKey);
  if (locked) {
    const ttl = await redis.ttl(lockKey);
    throw new AppError(
      `Too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`,
      429,
      "OTP_LOCKED"
    );
  }

  // Check rate limit (max OTP requests per hour)
  const requestCount = await redis.get(rateKey);
  if (requestCount && parseInt(requestCount) >= MAX_OTP_REQUESTS) {
    throw new AppError(
      "Too many OTP requests. Try again later.",
      429,
      "OTP_RATE_LIMITED"
    );
  }

  // Generate and hash OTP
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Store hashed OTP in Redis with TTL
  const otpData: StoredOtp = { hash: hashedOtp, attempts: 0 };
  await redis.setex(key, OTP_TTL, JSON.stringify(otpData));

  // Increment rate limit counter
  const currentCount = await redis.incr(rateKey);
  if (currentCount === 1) {
    await redis.expire(rateKey, RATE_LIMIT_TTL);
  }

  return otp; // Return plain OTP — only used to send via email
};

export const verifyOtp = async (
  email: string,
  inputOtp: string
): Promise<boolean> => {
  const key = `otp:${email}`;
  const lockKey = `otp-lock:${email}`;

  // Check lockout
  const locked = await redis.get(lockKey);
  if (locked) {
    throw new AppError(
      "Account temporarily locked due to failed attempts. Try again later.",
      429,
      "OTP_LOCKED"
    );
  }

  // Get stored OTP data
  const stored = await redis.get(key);
  if (!stored) {
    throw new AppError(
      "OTP expired or not found. Please request a new one.",
      400,
      "OTP_EXPIRED"
    );
  }

  const otpData: StoredOtp = JSON.parse(stored);

  // Check if max attempts exceeded
  if (otpData.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    await redis.setex(lockKey, LOCKOUT_TTL, "locked");
    throw new AppError(
      "Too many failed attempts. Account locked for 15 minutes.",
      429,
      "OTP_MAX_ATTEMPTS"
    );
  }

  // Compare OTP with stored hash
  const isValid = await bcrypt.compare(inputOtp, otpData.hash);

  if (!isValid) {
    // Increment attempt counter, keep same TTL
    const ttl = await redis.ttl(key);
    const updatedData: StoredOtp = {
      hash: otpData.hash,
      attempts: otpData.attempts + 1,
    };
    await redis.setex(key, ttl > 0 ? ttl : OTP_TTL, JSON.stringify(updatedData));

    const remaining = MAX_ATTEMPTS - otpData.attempts - 1;
    throw new AppError(
      `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      400,
      "OTP_INVALID"
    );
  }

  // OTP valid — clean up
  await redis.del(key);
  return true;
};