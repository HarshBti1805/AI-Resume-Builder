import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("24h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Email (Brevo HTTP API)
  BREVO_API_KEY: z.string(),
  // Verified Brevo sender address (the email you verify in Brevo).
  EMAIL_FROM: z.string(),

  // Legacy SMTP vars — kept optional so old .env files don't fail validation.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  ALLOWED_EMAIL_DOMAIN: z.string().default("chitkara.edu.in"),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  // AI providers — optional so existing .env files don't fail validation.
  // Read directly via process.env in the services that need them.
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Optional override for the agentic model.
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
