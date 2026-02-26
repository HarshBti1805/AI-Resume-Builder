# ChitkaraCV — Architectural Plan

## 1. Problem Statement

Students in the university lack standardized, ATS-friendly resume templates. This leads to inconsistent resume quality, poor ATS pass rates, and missed opportunities. The Resume Builder provides a structured, guided, and AI-enhanced platform to solve this.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                   Next.js (App Router)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │Auth Flow │  │Multi-Step│  │ Template │  │Preview/Edit/ │  │
│  │ (OTP)    │  │  Form    │  │ Selector │  │  Download    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   REVERSE PROXY / LOAD BALANCER              │
│                   Nginx (SSL, Rate Limiting)                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│            EXPRESS.JS + TYPESCRIPT — MODULAR MONOLITH        │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────────────┐ │ 
│  │ Auth Module│  │Resume Module│  │    AI Module           │ │
│  │  - OTP     │  │  - CRUD     │  │  - Content Gen (OpenAI)│ │
│  │  - JWT     │  │  - Templates│  │  - ATS Check           │ │
│  │  - Session │  │  - PDF Gen  │  │  - Summary Gen         │ │
│  └────────────┘  └─────────────┘  └────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ PostgreSQL   │ │  Redis   │ │ S3/MinIO │ │ OpenAI API   │
│ (via Prisma) │ │ (OTP,    │ │ (Photos, │ │ (GPT-4o /    │
│ Users,       │ │  Session,│ │  PDFs)   │ │  GPT-4o-mini)│
│ Resumes,     │ │  Cache,  │ │          │ │              │
│ Projects...  │ │  Rate    │ │          │ │              │
│              │ │  Limits) │ │          │ │              │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

**Architecture: Modular Monolith** — Single Express + TypeScript server with clean internal separation via modules (routes, controllers, services). Not microservices. This avoids unnecessary complexity for a prototype while keeping the codebase organized enough to extract services later if needed.

---

## 3. Technology Stack

| Layer         | Technology                   | Reason                                      |
| ------------- | ---------------------------- | ------------------------------------------- |
| Frontend      | Next.js 14 (App Router)      | SSR, routing, built-in optimizations        |
| UI            | Tailwind CSS + shadcn/ui     | Fast prototyping, consistent design         |
| State Mgmt    | Zustand                      | Lightweight, persists form across steps     |
| Backend       | Express.js + TypeScript      | Type safety, better DX, catch errors early  |
| Database      | PostgreSQL 15+               | Relational integrity, structured data       |
| ORM           | Prisma                       | Type-safe queries, auto migrations, studio  |
| Cache/Session | Redis                        | OTP storage, rate limiting, session cache   |
| File Storage  | AWS S3 / MinIO (self-hosted) | Profile photos, generated PDFs              |
| AI            | OpenAI API (GPT-4o-mini)     | Content generation, ATS analysis            |
| PDF Gen       | Puppeteer                    | Reliable HTML-to-PDF conversion             |
| Email         | Nodemailer + SMTP / SendGrid | OTP delivery                                |
| Deployment    | Docker + Docker Compose      | Consistent environments                     |
| Reverse Proxy | Nginx                        | Load balancing, SSL termination, rate limit |
| Monitoring    | PM2 + Winston + Prometheus   | Process management, logging, metrics        |

---

## 4. TypeScript Server Setup

### `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `server/package.json` Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc && npx prisma generate",
    "start": "node dist/server.js",
    "lint": "eslint src/ --ext .ts",
    "prisma:generate": "npx prisma generate",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:studio": "npx prisma studio"
  }
}
```

### Express Type Augmentation — `server/src/types/express.d.ts`

```typescript
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export {};
```

### Shared Types — `server/src/types/index.ts`

```typescript
import { Request, Response, NextFunction } from "express";

// Typed async handler to avoid try/catch in every controller
export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// API response shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// OTP stored in Redis
export interface StoredOtp {
  hash: string;
  attempts: number;
}

// ATS check result
export interface AtsResult {
  total: number;
  max: number;
  issues: string[];
  suggestions: string[];
}

// AI-generated ATS analysis
export interface AiAtsAnalysis {
  score: number;
  issues: string[];
  suggestions: string[];
}
```

---

## 5. Authentication Flow

```
Student                  Frontend                Backend                Redis            Email
  │                        │                        │                     │                │
  │── Enter uni email ────▶│                        │                     │                │
  │                        │── POST /auth/otp ─────▶│                     │                │
  │                        │                        │── Validate @uni.edu │                │
  │                        │                        │── Generate 6-digit  │                │
  │                        │                        │── Store OTP ───────▶│ (TTL: 5 min)   │
  │                        │                        │── Send email ──────────────────────▶ │
  │                        │◀── 200 OK ─────────────│                     │                │
  │                        │                        │                     │                │
  │── Enter OTP ──────────▶│                        │                     │                │
  │                        │── POST /auth/verify ──▶│                     │                │
  │                        │                        │── Fetch OTP ───────▶│                │
  │                        │                        │◀── OTP value ───────│                │
  │                        │                        │── Compare & validate                 │
  │                        │                        │── Upsert user in PostgreSQL          │
  │                        │                        │── Issue JWT (access + refresh)        │
  │                        │◀── JWT tokens ─────────│                     │                │
  │◀── Redirect to form ──│                        │                     │                │
```

### Security Measures

| Measure                  | Implementation                                        |
| ------------------------ | ----------------------------------------------------- |
| Email Domain Validation  | Only `@chitkara.edu.in` emails accepted               |
| OTP Brute-force          | Max 3 attempts per OTP; lockout 15 min after failure  |
| OTP Rate Limiting        | Max 3 OTP requests per email per hour (Redis counter) |
| JWT Access Token         | Short-lived (15 min), stored in httpOnly cookie       |
| JWT Refresh Token        | Long-lived (7 days), stored in httpOnly secure cookie |
| CSRF Protection          | SameSite=Strict cookie attribute                      |
| Helmet.js                | Security headers (XSS, HSTS, etc.)                    |
| Input Sanitization       | `express-validator` + Prisma parameterized queries    |
| SQL Injection Prevention | Prisma ORM never uses raw string interpolation        |

---

## 6. Database Schema (PostgreSQL + Prisma)

### Prisma Schema — `server/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String?
  isVerified Boolean  @default(false)
  lastLogin  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  resumes    Resume[]

  @@index([email])
}

// ─────────────────────────────────────────────
// RESUME (Central Record)
// ─────────────────────────────────────────────

model Resume {
  id               String         @id @default(uuid())
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId           String
  status           ResumeStatus   @default(DRAFT)
  currentStep      Int            @default(1)
  selectedTemplate TemplateType?

  // Step 1: Personal Details
  fullName         String?
  dateOfBirth      DateTime?
  phone            String?
  contactEmail     String?
  city             String?
  state            String?
  linkedin         String?
  github           String?
  portfolio        String?
  photoUrl         String?

  // Step 2: Academic Details
  university       String?
  stream           String?
  branch           String?
  batchStart       Int?
  batchEnd         Int?
  cgpa             Float?
  marks10th        Float?
  marks12th        Float?
  board10th        String?
  board12th        String?
  coursework       String[]       @default([])

  // Step 3: Skills (array of strings)
  skills           String[]       @default([])

  // Step 5: Hobbies & Summary
  hobbies          String[]       @default([])
  summary          String?
  aiGeneratedSummary String?

  // Metadata
  atsScore         Int?
  lastAtsCheck     DateTime?
  generatedPdfUrl  String?
  version          Int            @default(1)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // Relations (Step 3 & 4)
  projects         Project[]
  internships      Internship[]
  achievements     Achievement[]

  @@index([userId])
  @@index([userId, status])
}

// ─────────────────────────────────────────────
// STEP 3: Projects
// ─────────────────────────────────────────────

model Project {
  id          String   @id @default(uuid())
  resume      Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  title       String
  description String   @db.Text
  techStack   String[] @default([])
  liveUrl     String?
  repoUrl     String?
  startDate   DateTime?
  endDate     DateTime?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([resumeId])
}

// ─────────────────────────────────────────────
// STEP 4: Internships / Work Experience
// ─────────────────────────────────────────────

model Internship {
  id          String   @id @default(uuid())
  resume      Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  company     String
  role        String
  description String   @db.Text
  startDate   DateTime?
  endDate     DateTime?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([resumeId])
}

// ─────────────────────────────────────────────
// STEP 4: Achievements
// ─────────────────────────────────────────────

model Achievement {
  id          String          @id @default(uuid())
  resume      Resume          @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  title       String
  description String?         @db.Text
  date        DateTime?
  type        AchievementType @default(OTHER)
  sortOrder   Int             @default(0)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([resumeId])
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum ResumeStatus {
  DRAFT
  COMPLETED
}

enum TemplateType {
  CLASSIC
  MODERN
  MINIMAL
  ACADEMIC
  TECHNICAL
}

enum AchievementType {
  COMPETITION
  CERTIFICATION
  HACKATHON
  PUBLICATION
  OTHER
}
```

### Prisma Client Singleton — `server/src/config/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

export default prisma;
```

### Common Query Patterns

```typescript
import prisma from "../config/prisma";

// Create resume with nested projects
const resume = await prisma.resume.create({
  data: {
    userId: user.id,
    fullName: "John Doe",
    skills: ["React", "Node.js", "Python"],
    projects: {
      create: [
        { title: "Portfolio", description: "...", techStack: ["Next.js"] },
        { title: "Chat App", description: "...", techStack: ["Socket.io"] },
      ],
    },
  },
  include: { projects: true, internships: true, achievements: true },
});

// Update a specific step (optimistic locking)
const updated = await prisma.resume.updateMany({
  where: { id: resumeId, userId, version: currentVersion },
  data: { ...stepData, version: { increment: 1 } },
});
if (updated.count === 0) {
  throw new ConflictError("Resume was modified elsewhere");
}

// Fetch full resume with all relations
const fullResume = await prisma.resume.findUnique({
  where: { id: resumeId },
  include: {
    projects: { orderBy: { sortOrder: "asc" } },
    internships: { orderBy: { sortOrder: "asc" } },
    achievements: { orderBy: { sortOrder: "asc" } },
  },
});
```

### Migration Workflow

```bash
# During development — create and apply migration
npx prisma migrate dev --name add_portfolio_field

# In production — apply pending migrations
npx prisma migrate deploy

# Reset database (dev only — drops all data)
npx prisma migrate reset

# View database visually
npx prisma studio
```

---

## 7. API Design

### Auth Routes

```
POST   /api/auth/send-otp         → Send OTP to uni email
POST   /api/auth/verify-otp       → Verify OTP, upsert user, return JWT
POST   /api/auth/refresh          → Refresh access token
POST   /api/auth/logout           → Invalidate refresh token
```

### Resume Routes (Protected — JWT required)

```
POST   /api/resume                → Create new resume (returns resumeId)
GET    /api/resume/:id            → Get resume data with all relations
PATCH  /api/resume/:id/step/:step → Save a specific step (auto-save)
PUT    /api/resume/:id/template   → Set selected template
GET    /api/resume/:id/preview    → Get rendered HTML preview
POST   /api/resume/:id/download   → Generate & download PDF
```

### AI Routes (Protected — JWT + Rate Limited)

```
POST   /api/ai/generate-summary   → Generate professional summary from resume data
POST   /api/ai/enhance-text       → Improve a bullet point / description
POST   /api/ai/ats-check          → Run ATS compatibility check
```

### Upload Routes (Protected)

```
POST   /api/upload/photo           → Upload profile photo (max 2MB, jpg/png)
DELETE /api/upload/photo/:key      → Delete uploaded photo
```

---

## 8. Reliability & Availability Strategy

### Auto-Save Mechanism

```
User types in form
       │
       ▼ (debounced 2 seconds)
Save to Zustand (local state)
       │
       ▼ (debounced 5 seconds)
PATCH /api/resume/:id/step/:step
       │
       ├── Success → Update local "saved" indicator
       │
       └── Failure → Queue in localStorage → Retry with exponential backoff
```

- Form data is held in Zustand store (survives component re-renders)
- `useAutoSave` hook (`client/hooks/useAutoSave.ts`): debounced save trigger — pass `saveStepN` and step deps; skips when no `resumeId`. (Currently available but not wired; form saves on "Choose template" instead.)
- Failed saves are queued in `localStorage` and retried on next load (optional enhancement)
- `currentStep` is tracked server-side so user can resume where they left off

### Concurrency Control (Optimistic Locking)

```typescript
const updated = await prisma.resume.updateMany({
  where: {
    id: resumeId,
    userId,
    version: currentVersion,
  },
  data: {
    ...stepData,
    version: { increment: 1 },
  },
});

if (updated.count === 0) {
  throw new AppError("Resume was modified. Please refresh.", 409, "VERSION_CONFLICT");
}
```

### Process Management

```javascript
// ecosystem.config.js (PM2)
module.exports = {
  apps: [{
    name: "chitkaracv-api",
    script: "dist/server.js",
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "500M",
    env: { NODE_ENV: "production" },
    autorestart: true,
    max_restarts: 10,
    restart_delay: 1000,
  }],
};
```

### Health Checks

```typescript
import { Request, Response } from "express";
import prisma from "../config/prisma";
import redis from "../config/redis";

app.get("/health", async (_req: Request, res: Response) => {
  const checks = {
    server: "ok" as const,
    postgres: await prisma.$queryRaw`SELECT 1`
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
```

---

## 9. Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ LAYER 1: Network ─────────────────────────────────┐    │
│  │  • HTTPS everywhere (TLS 1.3)                      │    │
│  │  • Nginx rate limiting (100 req/min per IP)        │    │
│  │  • CORS whitelist (only frontend domain)           │    │
│  │  • DDoS protection (Cloudflare / uni firewall)     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─ LAYER 2: Application ─────────────────────────────┐    │
│  │  • Helmet.js (security headers)                    │    │
│  │  • express-rate-limit (per-route limits)           │    │
│  │  • Input validation (express-validator)            │    │
│  │  • SQL injection: impossible (Prisma parameterized)│    │
│  │  • XSS prevention (DOMPurify on frontend)          │    │
│  │  • CSRF tokens (SameSite=Strict cookies)           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─ LAYER 3: Authentication ──────────────────────────┐    │
│  │  • JWT access tokens (15 min TTL, httpOnly cookie) │    │ 
│  │  • Refresh tokens (7 day TTL, httpOnly, Secure)    │    │
│  │  • OTP hashed with bcrypt before storage           │    │
│  │  • Brute-force protection (3 attempts, 15 min lock)│    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─ LAYER 4: Data ────────────────────────────────────┐    │ 
│  │  • PostgreSQL with SSL connections                 │    │
│  │  • User can only access own resume (userId check)  │    │
│  │  • Prisma: no raw queries, parameterized by default│    │
│  │  • Cascade deletes (user deletion cleans all data) │    │
│  │  • S3 pre-signed URLs for photo access (1hr TTL)   │    │ 
│  │  • No PII in logs (Winston sanitized transport)    │    │
│  │  • Environment secrets in .env (never committed)   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Rate Limiting Strategy

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body.email || req.ip || "unknown",
  store: new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) }),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  store: new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) }),
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) }),
});
```

---

## 10. Performance & Zero-Latency Strategy

### Frontend Performance

| Technique          | Implementation                                     |
| ------------------ | -------------------------------------------------- |
| SSR/ISR            | Next.js SSR for initial load, ISR for templates    |
| Code Splitting     | Dynamic imports per step (`next/dynamic`)          |
| Image Optimization | `next/image` for profile photos                    |
| Bundle Size        | Tree-shaking, analyze with `@next/bundle-analyzer` |
| Prefetching        | `next/link` prefetch for predictable navigation    |

### Backend Performance

| Technique          | Implementation                                        |
| ------------------ | ----------------------------------------------------- |
| Connection Pooling | Prisma default pool (configurable via `DATABASE_URL`) |
| Response Caching   | Redis cache for template metadata (5 min TTL)         |
| Compression        | `compression` middleware (gzip responses)             |
| PDF Caching        | Cache generated PDFs in S3; regenerate on edit        |
| AI Response Cache  | Cache AI responses by input hash (Redis, 1hr TTL)     |
| Clustering         | PM2 cluster mode (1 worker per CPU core)              |

### Prisma Connection Pool Tuning

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=20&pool_timeout=10
```

**Target Response Times:**

- Static pages: < 50ms (Nginx/CDN cached)
- API reads: < 100ms (Prisma + Redis)
- API writes: < 200ms (direct Prisma)
- AI generation: < 3s (OpenAI API)
- PDF generation: < 5s (Puppeteer)

---

## 11. PDF Generation Pipeline

```
Resume Data (from PostgreSQL via Prisma)
       │
       ▼
Template Engine (Handlebars → HTML)
       │
       ▼
Inject resume data into template
       │
       ▼
Puppeteer loads HTML
       │
       ├── Injects print-ready CSS
       ├── Sets A4 page size
       ├── Waits for fonts/images to load
       │
       ▼
page.pdf({ format: 'A4', printBackground: true })
       │
       ▼
Upload to S3 + return download URL
```

### Puppeteer Pool (Avoid Cold Starts)

```typescript
import { createPool, Pool } from "generic-pool";
import puppeteer, { Browser } from "puppeteer";

const browserPool: Pool<Browser> = createPool(
  {
    create: () =>
      puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }),
    destroy: (browser: Browser) => browser.close(),
  },
  {
    max: 5,
    min: 1,
    idleTimeoutMillis: 60000,
  }
);

export default browserPool;
```

---

## 12. AI Integration Design (OpenAI)

### Content Generation

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ResumeDataForAI {
  stream: string;
  university: string;
  skills: string[];
  projects: { title: string }[];
  internships: { role: string; company: string }[];
}

export const generateSummary = async (resumeData: ResumeDataForAI): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume writer for university students. Write concise, impactful summaries.",
      },
      {
        role: "user",
        content: `Generate a 2-3 sentence professional summary for a ${resumeData.stream} student at ${resumeData.university}.
        Skills: ${resumeData.skills.join(", ")}
        Projects: ${resumeData.projects.map((p) => p.title).join(", ")}
        Experience: ${resumeData.internships.map((i) => `${i.role} at ${i.company}`).join(", ")}
        Write in first person. No generic phrases. Focus on specific skills and achievements.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? "";
};

export const enhanceBullet = async (rawText: string, context: string): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Rewrite resume bullet points to be impactful. Use action verbs, quantify results. Keep to 1-2 lines. Do not exaggerate.",
      },
      {
        role: "user",
        content: `Context: ${context}\nOriginal: ${rawText}\nReturn only the improved text.`,
      },
    ],
    max_tokens: 100,
    temperature: 0.6,
  });

  return response.choices[0].message.content ?? "";
};
```

### ATS Scoring Engine

```typescript
import OpenAI from "openai";
import type { AtsResult, AiAtsAnalysis } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ResumeDataForAts {
  contactEmail?: string | null;
  phone?: string | null;
  fullName?: string | null;
  cgpa?: number | null;
  skills: string[];
  summary?: string | null;
  projects: { title: string; description: string }[];
}

export const atsCheck = async (resumeData: ResumeDataForAts): Promise<AtsResult> => {
  const result: AtsResult = { total: 0, max: 100, issues: [], suggestions: [] };

  // ── Rule-based checks (40 points, instant) ──
  if (!resumeData.contactEmail) result.issues.push("Missing email");
  if (!resumeData.phone) result.issues.push("Missing phone number");
  if (!resumeData.skills.length) result.issues.push("No skills listed");
  if (!resumeData.summary) result.issues.push("No professional summary");
  if (resumeData.projects.length < 2) result.suggestions.push("Add more projects (minimum 2)");

  const sections = ["fullName", "cgpa", "skills", "summary"] as const;
  const filled = sections.filter((s) => {
    const val = resumeData[s];
    return val && (Array.isArray(val) ? val.length > 0 : true);
  });
  result.total += (filled.length / sections.length) * 40;

  // ── AI-powered analysis (60 points) ──
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an ATS compatibility analyzer. Return ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Analyze this resume for ATS compatibility. Score 0-60.
        Check: keyword density, action verbs, quantified achievements, professional language.
        Return JSON: { "score": number, "issues": string[], "suggestions": string[] }
        Resume: ${JSON.stringify(resumeData)}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
  });

  const aiResult: AiAtsAnalysis = JSON.parse(response.choices[0].message.content ?? "{}");
  result.total += aiResult.score;
  result.issues.push(...aiResult.issues);
  result.suggestions.push(...aiResult.suggestions);

  return result;
};
```

---

## 13. Deployment Architecture

### Docker Compose

```yaml
version: "3.8"

services:
  frontend:
    build: ./client
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on: [api]

  api:
    build: ./server
    ports: ["4000:4000"]
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/chitkaracv?schema=public
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - S3_BUCKET=${S3_BUCKET}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: chitkaracv
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
    ports: ["6379:6379"]
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on: [frontend, api]

volumes:
  postgres_data:
  redis_data:
```

### Server Dockerfile (TypeScript Build)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/templates ./templates
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

---

## 14. Monitoring & Logging

### Logger Setup

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
```

### Request Logging Middleware

```typescript
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id,
      requestId: req.headers["x-request-id"],
    });
  });
  next();
};
```

### Key Metrics

- API Response Times (p50, p95, p99 per endpoint)
- Error Rates (4xx, 5xx per endpoint)
- OTP Send/Verify success rates
- OpenAI API latency and failure rates
- PDF generation time
- Active users / concurrent sessions
- Prisma query performance (via Prisma metrics)
- PostgreSQL connection pool utilization
- Redis hit/miss ratio

---

## 15. Error Handling Strategy

### AppError Class

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

### Global Error Handler

```typescript
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
    error: err.message,
    stack: err.stack,
    requestId: req.headers["x-request-id"],
  });

  // Prisma: unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      success: false,
      error: { code: "DUPLICATE_ENTRY", message: "This record already exists" },
    });
    return;
  }

  // Prisma: record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Record not found" },
    });
    return;
  }

  // Operational errors (thrown intentionally)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unexpected errors
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
};
```

### Graceful Shutdown

```typescript
import prisma from "./config/prisma";
import redis from "./config/redis";
import browserPool from "./services/pdf.service";
import logger from "./utils/logger";

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close();
  await prisma.$disconnect();
  await redis.quit();
  await browserPool.drain();
  await browserPool.clear();

  logger.info("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

---

## 16. Folder Structure

```
chitkara-cv/
├── client/                          # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── (protected)/
│   │   │   ├── form/
│   │   │   │   ├── layout.tsx       # Stepper layout
│   │   │   │   ├── personal/page.tsx
│   │   │   │   ├── academic/page.tsx
│   │   │   │   ├── skills/page.tsx
│   │   │   │   ├── experience/page.tsx
│   │   │   │   └── summary/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   └── preview/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── form/
│   │   ├── templates/
│   │   │   ├── ClassicTemplate.tsx
│   │   │   ├── ModernTemplate.tsx
│   │   │   ├── MinimalTemplate.tsx
│   │   │   ├── AcademicTemplate.tsx
│   │   │   └── TechnicalTemplate.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── theme-provider.tsx
│   │   └── common/
│   ├── hooks/
│   │   └── useAutoSave.ts         # Debounced auto-save hook (resume steps)
│   ├── store/
│   │   ├── authStore.ts          # Auth state (user, sendOtp, verifyOtp, logout)
│   │   └── resumeStore.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── validators.ts
│   └── middleware.ts
│
├── server/                          # Express Backend (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma            # ← Database schema (source of truth)
│   │   └── migrations/              # ← Auto-generated by Prisma
│   ├── src/
│   │   ├── config/
│   │   │   ├── prisma.ts            # Prisma client singleton
│   │   │   ├── redis.ts             # Redis connection
│   │   │   └── env.ts               # Env validation (zod)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification
│   │   │   ├── rateLimiter.ts       # Rate limiting configs
│   │   │   ├── validate.ts          # Request validation
│   │   │   ├── requestLogger.ts     # Request/response logging
│   │   │   └── errorHandler.ts      # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── resume.route.ts
│   │   │   ├── ai.route.ts
│   │   │   └── upload.route.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── resume.controller.ts
│   │   │   ├── preview.controller.ts    # HTML preview rendering
│   │   │   ├── pdf.controller.ts        # PDF download
│   │   │   ├── ai.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── services/
│   │   │   ├── otp.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── ai.service.ts        # OpenAI API wrapper
│   │   │   ├── ats.service.ts       # ATS scoring engine
│   │   │   ├── storage.service.ts   # S3/MinIO upload & delete
│   │   │   ├── template.service.ts  # Handlebars template rendering
│   │   │   └── pdf.service.ts       # Puppeteer PDF generation
│   │   ├── types/
│   │   │   ├── express.d.ts         # Express request augmentation
│   │   │   └── index.ts             # Shared types, getParam(), JwtPayload
│   │   ├── utils/
│   │   │   ├── AppError.ts
│   │   │   └── logger.ts            # Winston config
│   │   └── server.ts                # Entry point
│   ├── templates/
│   │   ├── classic.hbs
│   │   ├── modern.hbs
│   │   ├── minimal.hbs
│   │   ├── academic.hbs
│   │   └── technical.hbs
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── .env.example
└── README.md
```

---

## 17. Implementation Roadmap

### Phase 1 — Foundation (Week 1-2)

- [ ] Project setup (Next.js + Express TypeScript + Docker Compose)
- [ ] TypeScript config (`tsconfig.json`, type definitions, tsx dev runner)
- [ ] PostgreSQL + Prisma setup (schema, initial migration)
- [ ] Redis setup
- [ ] Auth flow (email validation, OTP, JWT)
- [ ] Basic middleware (helmet, CORS, rate limiting, error handler)
- [ ] Prisma client singleton + health check endpoint

### Phase 2 — Core Form (Week 2-3)

- [ ] Multi-step form with Zustand state management
- [ ] All 5 form sections with Zod validation
- [ ] Auto-save with debounce + retry logic
- [ ] Photo upload (multer → S3)
- [ ] Resume CRUD API endpoints (Prisma queries)

### Phase 3 — Templates & PDF (Week 3-4)

- [ ] Build 5 ATS-compliant templates (React components)
- [ ] Template selection page
- [ ] Preview page with contentEditable minor edits
- [ ] Puppeteer PDF generation pipeline
- [ ] PDF caching in S3

### Phase 4 — AI Features (Week 4-5)

- [ ] OpenAI integration (service layer)
- [ ] Summary generation from form data
- [ ] Bullet point enhancement
- [ ] ATS scoring engine (rules + AI hybrid)
- [ ] AI response caching in Redis

### Phase 5 — Hardening (Week 5-6)

- [ ] Security audit (all layers)
- [ ] Load testing (Artillery / k6)
- [ ] Monitoring setup (PM2 + Winston + health checks)
- [ ] Graceful shutdown (Prisma disconnect)
- [ ] TypeScript build pipeline + production Dockerfile
- [ ] Final Docker + Nginx setup
- [ ] Documentation

---

## 18. Scaling Considerations (Post-Prototype)

When moving from prototype to production:

| Concern        | Prototype                    | Production                                              |
| -------------- | ---------------------------- | ------------------------------------------------------- |
| Database       | Single PostgreSQL instance   | Managed Postgres (Supabase/Neon/RDS with read replicas) |
| Cache          | Single Redis                 | Redis Cluster / ElastiCache                             |
| Backend        | PM2 cluster (single server)  | Kubernetes / ECS (horizontal scaling)                   |
| PDF Generation | Puppeteer pool (5 instances) | Dedicated PDF worker nodes                              |
| File Storage   | Local MinIO                  | AWS S3 with CloudFront CDN                              |
| AI API         | Direct OpenAI calls          | Queue-based (Bull/BullMQ) with retries                  |
| Auth           | JWT + Redis                  | SSO integration with university IdP                     |
| Monitoring     | Winston + PM2                | Datadog / New Relic / Grafana Cloud                     |
| Migrations     | `prisma migrate dev`         | CI/CD pipeline with `prisma migrate deploy`             |