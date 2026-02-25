# University Resume Builder — Architectural Plan

## 1. Problem Statement

Students in the university lack standardized, ATS-friendly resume templates. This leads to inconsistent resume quality, poor ATS pass rates, and missed opportunities. The Resume Builder provides a structured, guided, and AI-enhanced platform to solve this.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                   Next.js (App Router)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Auth Flow │  │Multi-Step│  │ Template  │  │Preview/Edit/ │ │
│  │ (OTP)    │  │  Form    │  │ Selector  │  │  Download    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY / LOAD BALANCER              │
│                        Nginx (SSL, Rate Limiting)             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              EXPRESS.JS — MODULAR MONOLITH                    │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ Auth Module│  │Resume Module│  │    AI Module           │ │
│  │  - OTP     │  │  - CRUD     │  │  - Content Gen (OpenAI)│ │
│  │  - JWT     │  │  - Templates│  │  - ATS Check           │ │
│  │  - Session │  │  - PDF Gen  │  │  - Summary Gen         │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
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

**Architecture: Modular Monolith** — Single Express server with clean internal separation via modules (routes, controllers, services). Not microservices. This avoids unnecessary complexity for a prototype while keeping the codebase organized enough to extract services later if needed.

---

## 3. Technology Stack

| Layer         | Technology                   | Reason                                      |
| ------------- | ---------------------------- | ------------------------------------------- |
| Frontend      | Next.js 14 (App Router)      | SSR, routing, built-in optimizations        |
| UI            | Tailwind CSS + shadcn/ui     | Fast prototyping, consistent design         |
| State Mgmt    | Zustand                      | Lightweight, persists form across steps     |
| Backend       | Express.js (Node 20+)        | Fast API development, ecosystem             |
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

## 4. Authentication Flow

```
Student                  Frontend              Backend              Redis          Email
  │                        │                     │                    │               │
  │── Enter uni email ────▶│                     │                    │               │
  │                        │── POST /auth/otp ──▶│                    │               │
  │                        │                     │── Validate @uni.edu│               │
  │                        │                     │── Generate 6-digit │               │
  │                        │                     │── Store OTP ──────▶│ (TTL: 5 min)  │
  │                        │                     │── Send email ─────────────────────▶│
  │                        │◀── 200 OK ──────────│                    │               │
  │                        │                     │                    │               │
  │── Enter OTP ──────────▶│                     │                    │               │
  │                        │── POST /auth/verify▶│                    │               │
  │                        │                     │── Fetch OTP ──────▶│               │
  │                        │                     │◀── OTP value ──────│               │
  │                        │                     │── Compare & validate               │
  │                        │                     │── Upsert user in PostgreSQL        │
  │                        │                     │── Issue JWT (access + refresh)      │
  │                        │◀── JWT tokens ──────│                    │               │
  │◀── Redirect to form ──│                     │                    │               │
```

### Security Measures

| Measure                  | Implementation                                        |
| ------------------------ | ----------------------------------------------------- |
| Email Domain Validation  | Only `@university.edu` emails accepted                |
| OTP Brute-force          | Max 3 attempts per OTP; lockout 15 min after failure  |
| OTP Rate Limiting        | Max 3 OTP requests per email per hour (Redis counter) |
| JWT Access Token         | Short-lived (15 min), stored in httpOnly cookie       |
| JWT Refresh Token        | Long-lived (7 days), stored in httpOnly secure cookie |
| CSRF Protection          | SameSite=Strict cookie attribute                      |
| Helmet.js                | Security headers (XSS, HSTS, etc.)                    |
| Input Sanitization       | `express-validator` + Prisma parameterized queries    |
| SQL Injection Prevention | Prisma ORM never uses raw string interpolation        |

---

## 5. Database Schema (PostgreSQL + Prisma)

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

### Prisma Client Singleton — `server/src/config/prisma.js`

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

module.exports = prisma;
```

### Common Query Patterns

```javascript
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
  where: { id: resumeId, userId: userId, version: currentVersion },
  data: { ...stepData, version: { increment: 1 } },
});
if (updated.count === 0)
  throw new ConflictError("Resume was modified elsewhere");

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

## 6. API Design

### Auth Routes

```
POST   /api/auth/send-otp         → Send OTP to uni email
POST   /api/auth/verify-otp       → Verify OTP, upsert user, return JWT
POST   /api/auth/refresh           → Refresh access token
POST   /api/auth/logout             → Invalidate refresh token
```

### Resume Routes (Protected — JWT required)

```
POST   /api/resume                  → Create new resume (returns resumeId)
GET    /api/resume/:id              → Get resume data with all relations
PATCH  /api/resume/:id/step/:step   → Save a specific step (auto-save)
PUT    /api/resume/:id/template     → Set selected template
GET    /api/resume/:id/preview      → Get rendered HTML preview
POST   /api/resume/:id/download     → Generate & download PDF
```

### AI Routes (Protected — JWT + Rate Limited)

```
POST   /api/ai/generate-summary     → Generate professional summary from resume data
POST   /api/ai/enhance-text         → Improve a bullet point / description
POST   /api/ai/ats-check            → Run ATS compatibility check
```

### Upload Routes (Protected)

```
POST   /api/upload/photo             → Upload profile photo (max 2MB, jpg/png)
DELETE /api/upload/photo/:key        → Delete uploaded photo
```

---

## 7. Reliability & Availability Strategy

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
- Debounced API calls every 5 seconds to avoid excessive requests
- Failed saves are queued in `localStorage` and retried on next load
- `currentStep` is tracked server-side so user can resume where they left off

### Concurrency Control (Optimistic Locking)

```javascript
// Every resume has a `version` field
// Updates are conditional on version match
const updated = await prisma.resume.updateMany({
  where: {
    id: resumeId,
    userId: userId,
    version: currentVersion, // Only update if version matches
  },
  data: {
    ...stepData,
    version: { increment: 1 }, // Bump version on success
  },
});

if (updated.count === 0) {
  // Version mismatch — stale data, someone else updated
  throw new ConflictError("Resume was modified. Please refresh.");
}
```

- If two tabs are open, the stale one gets a conflict error and must refresh
- Prevents lost updates without database-level locks

### Process Management

```yaml
# ecosystem.config.js (PM2)
module.exports = {
  apps: [{
    name: "resume-api",
    script: "dist/server.js",
    instances: "max",          # One process per CPU core
    exec_mode: "cluster",      # Cluster mode for load balancing
    max_memory_restart: "500M",
    env: { NODE_ENV: "production" },
    autorestart: true,
    max_restarts: 10,
    restart_delay: 1000
  }]
};
```

### Health Checks

```javascript
// GET /health — used by load balancer / monitoring
app.get("/health", async (req, res) => {
  const checks = {
    server: "ok",
    postgres: await prisma.$queryRaw`SELECT 1`
      .then(() => "ok")
      .catch(() => "down"),
    redis: await redis
      .ping()
      .then(() => "ok")
      .catch(() => "down"),
    timestamp: new Date(),
  };
  const healthy = checks.postgres === "ok" && checks.redis === "ok";
  res.status(healthy ? 200 : 503).json(checks);
});
```

---

## 8. Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ LAYER 1: Network ─────────────────────────────────┐    │
│  │  • HTTPS everywhere (TLS 1.3)                      │    │
│  │  • Nginx rate limiting (100 req/min per IP)        │    │
│  │  • CORS whitelist (only frontend domain)           │    │
│  │  • DDoS protection (Cloudflare / uni firewall)     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
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

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OTP requests per window
  keyGenerator: (req) => req.body.email || req.ip,
  store: new RedisStore({ client: redis }),
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute per user
  keyGenerator: (req) => req.user.id,
  store: new RedisStore({ client: redis }),
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: new RedisStore({ client: redis }),
});

app.use("/api/auth", authLimiter);
app.use("/api/ai", aiLimiter);
app.use("/api", generalLimiter);
```

---

## 9. Performance & Zero-Latency Strategy

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
# In DATABASE_URL, add connection pool params
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=20&pool_timeout=10
```

**Target Response Times:**

- Static pages: < 50ms (Nginx/CDN cached)
- API reads: < 100ms (Prisma + Redis)
- API writes: < 200ms (direct Prisma)
- AI generation: < 3s (OpenAI API)
- PDF generation: < 5s (Puppeteer)

---

## 10. PDF Generation Pipeline

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

```javascript
const pool = createPool({
  create: () =>
    puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    }),
  destroy: (browser) => browser.close(),
  max: 5, // Max 5 concurrent browsers
  min: 1, // Keep 1 warm at all times
  idleTimeoutMillis: 60000,
});
```

---

## 11. AI Integration Design (OpenAI)

### Content Generation

```javascript
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Summary Generation
const generateSummary = async (resumeData) => {
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

  return response.choices[0].message.content;
};

// Bullet Enhancement
const enhanceBullet = async (rawText, context) => {
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

  return response.choices[0].message.content;
};
```

### ATS Scoring Engine

```javascript
const atsCheck = async (resumeData) => {
  const score = { total: 0, max: 100, issues: [], suggestions: [] };

  // ── Rule-based checks (40 points, instant) ──
  if (!resumeData.contactEmail) score.issues.push("Missing email");
  if (!resumeData.phone) score.issues.push("Missing phone number");
  if (!resumeData.skills.length) score.issues.push("No skills listed");
  if (!resumeData.summary) score.issues.push("No professional summary");
  if (resumeData.projects.length < 2)
    score.suggestions.push("Add more projects (minimum 2)");

  const sections = ["fullName", "cgpa", "skills", "summary"];
  const filled = sections.filter(
    (s) =>
      resumeData[s] &&
      (Array.isArray(resumeData[s]) ? resumeData[s].length > 0 : true),
  );
  score.total += (filled.length / sections.length) * 40;

  // ── AI-powered analysis (60 points) ──
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an ATS compatibility analyzer. Return ONLY valid JSON.",
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

  const aiResult = JSON.parse(response.choices[0].message.content);
  score.total += aiResult.score;
  score.issues.push(...aiResult.issues);
  score.suggestions.push(...aiResult.suggestions);

  return score;
};
```

---

## 12. Deployment Architecture

### Docker Compose

```yaml
version: "3.8"

services:
  # Frontend
  frontend:
    build: ./client
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on: [api]

  # Backend API
  api:
    build: ./server
    ports: ["4000:4000"]
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/uniresume?schema=public
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

  # Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: uniresume
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Cache
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

  # Reverse Proxy
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

### Nginx Configuration (Key Parts)

```nginx
upstream api_backend {
    least_conn;
    server api:4000;
}

server {
    listen 443 ssl;
    server_name resume.university.edu;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    location /api/auth/ {
        limit_req zone=auth burst=3 nodelay;
        proxy_pass http://api_backend;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-ID $request_id;
    }

    location / {
        proxy_pass http://frontend:3000;
    }

    location /_next/static/ {
        proxy_pass http://frontend:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 13. Monitoring & Logging

### What to Log

```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id, // Never log email/PII
      requestId: req.headers["x-request-id"],
    });
  });
  next();
});
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

## 14. Error Handling Strategy

### Global Error Handler

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    code: err.code,
    stack: err.stack,
    requestId: req.headers["x-request-id"],
  });

  // Handle Prisma-specific errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: { code: "DUPLICATE_ENTRY", message: "This record already exists" },
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Record not found" },
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
});
```

### Graceful Shutdown

```javascript
const shutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close();
  await prisma.$disconnect();
  await redis.quit();
  await puppeteerPool.drain();
  await puppeteerPool.clear();

  logger.info("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

---

## 15. Folder Structure

```
uni-resume/
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
│   │   └── common/
│   ├── store/
│   │   └── resumeStore.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── validators.ts
│   └── middleware.ts
│
├── server/                          # Express Backend
│   ├── prisma/
│   │   ├── schema.prisma            # ← Database schema (source of truth)
│   │   └── migrations/              # ← Auto-generated by Prisma
│   ├── src/
│   │   ├── config/
│   │   │   ├── prisma.js            # Prisma client singleton
│   │   │   ├── redis.js
│   │   │   └── env.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── resume.routes.js
│   │   │   ├── ai.routes.js
│   │   │   └── upload.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── resume.controller.js
│   │   │   ├── ai.controller.js
│   │   │   └── upload.controller.js
│   │   ├── services/
│   │   │   ├── otp.service.js
│   │   │   ├── email.service.js
│   │   │   ├── ai.service.js        # OpenAI API wrapper
│   │   │   ├── pdf.service.js
│   │   │   └── ats.service.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   └── logger.js
│   │   └── server.js
│   ├── templates/
│   │   ├── classic.hbs
│   │   ├── modern.hbs
│   │   ├── minimal.hbs
│   │   ├── academic.hbs
│   │   └── technical.hbs
│   └── package.json
│
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── .env.example
└── README.md
```

---

## 16. Implementation Roadmap

### Phase 1 — Foundation (Week 1-2)

- [ ] Project setup (Next.js + Express + Docker Compose)
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
- [ ] Final Docker + Nginx setup
- [ ] Documentation

---

## 17. Scaling Considerations (Post-Prototype)

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
