# 📄 ChitkaraCV — University Resume Builder

A structured, AI-enhanced resume builder designed to solve the lack of standardized, ATS-friendly resume templates for university students. Students choose a template first, fill a guided multi-step form with live preview, use an IDE-like editing room, and download polished, ATS-compliant resumes. Optionally they can upload an existing resume for AI-powered parsing and pre-fill.

> **Status:** Prototype. See **IMPROVEMENTS.md** for the full improvement spec (all 7 improvements implemented).

---

## Problem Statement

Students in our university have no fixed resume templates, leading to inconsistent formatting and poor ATS (Applicant Tracking System) compatibility. ChitkaraCV provides a guided flow that guarantees every resume is structured, professional, and ATS-friendly — regardless of the student's design skills.

---

## Features

- **OTP-Based Auth** — Students verify via university email (`@chitkara.edu.in`). Sessions persist for 24 hours (access token) with a 7-day refresh token; a **Log out** button is available on the start page when signed in.
- **Start Choice** — Upload an existing resume (PDF/DOCX) for AI-powered parsing and pre-fill, or start from scratch
- **Template First** — Choose one of 5 ATS-compliant templates before filling the form; switch template anytime during form or in the editing room
- **Multi-Step Form + Live Preview** — Split-screen: form on the left, live resume preview on the right (Personal → Academic → Skills → Experience → Summary)
- **Editing Room** — IDE-like split view: structured editor (reorder sections, edit bullets, font/style controls, custom sections) with live preview
- **Bullet-Point Projects & Experience** — Per-bullet editing with drag-and-drop; optional subtitle/tagline per project
- **Categorized Skills** — Organize skills by category (e.g. Languages, Frameworks, AI/ML)
- **AI Everywhere** — Summary generation, per-bullet improve/add keywords, generate bullets from description, full resume refinement, ATS check
- **ATS Checker** — Hybrid rule-based + AI scoring with actionable suggestions
- **PDF Download** — Server-side PDF generation via Puppeteer
- **Auto-Save** — Debounced saves so students never lose progress
- **Profile Photo Upload** — Optional image support

---

## Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Frontend     | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand |
| Backend      | Express.js + TypeScript, Node.js 20+                      |
| Database     | PostgreSQL + Prisma ORM                                   |
| Cache        | Redis                                                     |
| AI           | OpenAI API (GPT-4o / GPT-4o-mini)                         |
| PDF          | Puppeteer                                                 |
| Email        | Nodemailer                                                |
| File Storage | AWS S3 / MinIO                                            |
| Deployment   | Docker, Nginx                                             |

---

## Project Structure

```
chitkara-cv/
├── client/                       # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/            # Email entry
│   │   │   └── verify/           # OTP verification
│   │   ├── (protected)/
│   │   │   ├── start/            # Upload resume | Start from scratch
│   │   │   ├── templates/
│   │   │   │   └── select/       # Template selection (before form)
│   │   │   ├── form/
│   │   │   │   ├── layout.tsx    # Stepper + live preview split
│   │   │   │   ├── personal/     # Step 1: Personal Details
│   │   │   │   ├── academic/     # Step 2: Academic Info
│   │   │   │   ├── skills/       # Step 3: Skills & Projects (categorized)
│   │   │   │   ├── experience/   # Step 4: Experience & Achievements (bullets)
│   │   │   │   └── summary/      # Step 5: Hobbies & Summary
│   │   │   ├── editor/           # IDE-like editing room
│   │   │   └── preview/          # Preview, edit & download PDF
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── form/                 # Form step components
│   │   ├── editor/               # AIButton, BulletEditor, SectionList, StyleControls, CustomSectionEditor
│   │   ├── preview/              # LivePreview (form + editor)
│   │   ├── templates/            # 5 resume template components
│   │   ├── theme-toggle.tsx      # Light/dark mode toggle
│   │   ├── theme-provider.tsx    # Theme context provider
│   │   └── common/               # Header, Stepper, etc.
│   ├── hooks/
│   │   └── useAutoSave.ts        # Debounced auto-save hook (optional)
│   ├── store/
│   │   ├── authStore.ts          # Zustand auth state (user, OTP, logout)
│   │   └── resumeStore.ts        # Form + editor state, prefillFromParsed
│   ├── lib/
│   │   ├── api.ts                # Axios instance
│   │   └── validators.ts         # Zod validation schemas
│   └── middleware.ts             # Auth route protection
│
├── server/                       # Express.js Backend (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── migrations/           # Auto-generated migrations
│   ├── src/
│   │   ├── config/
│   │   │   ├── prisma.ts         # Prisma client singleton
│   │   │   ├── redis.ts          # Redis connection
│   │   │   └── env.ts            # Env variable validation
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── rateLimiter.ts    # Rate limiting
│   │   │   ├── validate.ts       # Request validation
│   │   │   ├── requestLogger.ts  # Request/response logging
│   │   │   └── errorHandler.ts   # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── resume.route.ts
│   │   │   ├── ai.route.ts
│   │   │   └── upload.route.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── resume.controller.ts
│   │   │   ├── preview.controller.ts  # HTML preview
│   │   │   ├── pdf.controller.ts      # PDF download
│   │   │   ├── ai.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── services/
│   │   │   ├── otp.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── ai.service.ts     # OpenAI API wrapper
│   │   │   ├── ats.service.ts    # ATS scoring engine
│   │   │   ├── storage.service.ts    # S3/MinIO upload & delete
│   │   │   ├── template.service.ts   # Handlebars template rendering
│   │   │   └── pdf.service.ts    # Puppeteer PDF generation
│   │   ├── types/
│   │   │   ├── express.d.ts      # Express request augmentation
│   │   │   └── index.ts          # Shared types, getParam(), JwtPayload, ApiResponse
│   │   ├── utils/
│   │   │   ├── AppError.ts
│   │   │   └── logger.ts
│   │   └── server.ts
│   ├── templates/                # Handlebars templates for PDF
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Database Schema (Prisma)

The full schema lives in `server/prisma/schema.prisma`. Core models:

- **User** — university email, auth metadata
- **Resume** — central record with personal, academic, and editor fields (section order, font/style, origin)
- **Project** — project entries with **bullet points** (ProjectBullet); title, subtitle, tech stack, URLs
- **Internship** — experience entries with **bullet points** (InternshipBullet)
- **Achievement** — competitions, certifications, hackathons (with type, link, description)
- **SkillCategory** — categorized skills (e.g. Languages, Frameworks)
- **Hobby** — name + optional description
- **CustomSection** / **CustomSectionItem** — user-added sections in the editing room

See IMPROVEMENTS.md and PROJECT_PLAN.md for full schema details.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or cloud — Supabase, Neon, Railway, etc.)
- Redis
- OpenAI API key
- SMTP credentials (Gmail App Password / SendGrid / Mailtrap for dev)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/chitkara-cv.git
cd chitkara-cv
```

### 2. Environment Variables

Create `.env` files in both `client/` and `server/` directories:

**`server/.env`**

```env
# Server
PORT=4000
NODE_ENV=development

# PostgreSQL (Prisma)
DATABASE_URL=postgresql://postgres:password@localhost:5432/chitkaracv?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
S3_BUCKET=chitkaracv-uploads
S3_REGION=ap-south-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Allowed Email Domain
ALLOWED_EMAIL_DOMAIN=chitkara.edu.in
```

**`client/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Install Dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 4. Set Up the Database

```bash
cd server

# Generate Prisma client from schema
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect your DB visually
npx prisma studio
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend (tsx watches and recompiles TypeScript)
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Frontend runs on `http://localhost:3000`, Backend on `http://localhost:4000`.

### 6. Run with Docker (Optional)

```bash
docker-compose up --build
```

This starts the frontend, backend, PostgreSQL, and Redis containers together.

---

## API Endpoints

### Auth

| Method | Endpoint               | Description            |
| ------ | ---------------------- | ---------------------- |
| POST   | `/api/auth/send-otp`   | Send OTP to uni email  |
| POST   | `/api/auth/verify-otp` | Verify OTP, return JWT |
| POST   | `/api/auth/refresh`    | Refresh access token   |
| POST   | `/api/auth/logout`     | Invalidate session     |

### Resume (Protected)

| Method | Endpoint                               | Description                         |
| ------ | -------------------------------------- | ----------------------------------- |
| POST   | `/api/resume`                          | Create new resume                   |
| GET    | `/api/resume/:id`                      | Get resume data                     |
| GET    | `/api/resume/me`                       | Get current user's resume(s)        |
| PATCH  | `/api/resume/:id/step/:step`           | Save a form step                    |
| PUT    | `/api/resume/:id/template`             | Set selected template               |
| PUT    | `/api/resume/:id/sections/order`       | Reorder sections (editor)           |
| PUT    | `/api/resume/:id/styles`               | Update font/color/spacing           |
| POST   | `/api/resume/:id/sections/custom`      | Add custom section                  |
| PATCH  | `/api/resume/:id/sections/custom/:sId` | Update custom section               |
| DELETE | `/api/resume/:id/sections/custom/:sId` | Delete custom section               |
| GET    | `/api/resume/:id/preview`              | Get HTML preview                    |
| POST   | `/api/resume/:id/preview-live`         | Live preview (client payload)       |
| POST   | `/api/resume/:id/download`             | Generate & download PDF             |
| POST   | `/api/resume/upload-parse`             | Upload PDF/DOCX, return parsed data |
| DELETE | `/api/resume/:id`                      | Delete resume                       |

### AI (Protected + Rate Limited)

| Method | Endpoint                   | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| POST   | `/api/ai/generate-summary` | Generate professional summary      |
| POST   | `/api/ai/enhance-text`     | Improve a bullet/description       |
| POST   | `/api/ai/ats-check`        | Run ATS compatibility check        |
| POST   | `/api/ai/improve-bullet`   | Improve single bullet              |
| POST   | `/api/ai/add-keywords`     | Add ATS keywords to text           |
| POST   | `/api/ai/generate-bullets` | Generate bullets from description  |
| POST   | `/api/ai/refine-resume`    | Full resume analysis & suggestions |

### Upload (Protected)

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| POST   | `/api/upload/photo`      | Upload profile photo |
| DELETE | `/api/upload/photo/:key` | Delete photo         |

---

## User Flow

```
1. Landing Page
   └──▶ 2. Enter University Email
         └──▶ 3. Verify OTP
               └──▶ 4. Start page (/start) — Upload existing resume or Start from scratch
                     ├── [Upload Existing Resume] → Parse (PDF/DOCX) → Pre-fill → Template Select
                     └── [Start from Scratch]      → Template Select
                           └──▶ 5. Multi-Step Form (split-screen with live preview)
                                 ├── Step 1: Personal Details
                                 ├── Step 2: Academic Info
                                 ├── Step 3: Skills & Projects (bullets, categories)
                                 ├── Step 4: Experience & Achievements
                                 └── Step 5: Hobbies & Summary
                                       └──▶ 6. Editing Room (sections, bullets, styles, AI)
                                             └──▶ 7. Preview & Download PDF
```

---

## Templates

| #   | Template  | Best For                     | Layout                          |
| --- | --------- | ---------------------------- | ------------------------------- |
| 1   | Classic   | General purpose, traditional | Single column, serif font       |
| 2   | Modern    | Clean, contemporary look     | Sans-serif, color accent        |
| 3   | Minimal   | Maximum readability          | Lots of whitespace              |
| 4   | Academic  | Research / higher-ed focused | Education-first ordering        |
| 5   | Technical | CS / Engineering students    | Skills-prominent, project-heavy |

All templates are ATS-compliant by design: single-column layouts, standard section headings, system fonts, no text-in-images, proper heading hierarchy.

---

## AI Features (OpenAI)

### Summary Generation

Collects data from all form steps and generates a 2-3 sentence professional summary using GPT-4o-mini. Students can regenerate or manually edit.

### Per-Bullet & Section AI

In the form and editing room: **Improve** (action verbs, metrics), **Add Keywords** (ATS-friendly terms), and **Generate Bullets** from a raw project description. Section-level **Refine All Bullets** and **ATS Keyword Scan** are available in the editing room.

### Full Resume Refinement

**Refine resume** returns structured suggestions (section, original vs improved text, reason), missing keywords, and an overall ATS score.

### ATS Checker

Hybrid scoring system:

- **Rule-based** (40 points) — checks section completeness, contact info, skill count
- **AI-powered** (60 points) — GPT analyzes keyword density, action verbs, professional language

Returns a score out of 100 with specific issues and suggestions.

---

## Key Dependencies

### Client

```
next, react, react-dom
tailwindcss, @shadcn/ui
zustand                    # State management
zod                        # Form validation
axios                      # HTTP client
react-hook-form            # Form handling
@hookform/resolvers        # Zod + react-hook-form bridge
```

### Server

```
express                    # Web framework
@prisma/client             # Prisma ORM (PostgreSQL)
prisma                     # Prisma CLI (dev dependency)
ioredis                    # Redis client
jsonwebtoken               # JWT auth
bcryptjs                   # OTP hashing
nodemailer                 # Email sending
openai                     # OpenAI SDK
puppeteer                  # PDF generation
multer                     # File upload
@aws-sdk/client-s3         # S3 uploads
helmet                     # Security headers
cors                       # CORS config
express-rate-limit         # Rate limiting
rate-limit-redis           # Redis-backed rate limits
express-validator          # Input validation
winston                    # Logging
compression                # Response compression

# TypeScript (dev dependencies)
typescript                 # TypeScript compiler
tsx                        # Dev server (watch + run .ts directly)
@types/express             # Express type definitions
@types/node                # Node.js type definitions
@types/jsonwebtoken        # JWT type definitions
@types/bcryptjs            # Bcrypt type definitions
@types/nodemailer          # Nodemailer type definitions
@types/cors                # CORS type definitions
@types/compression         # Compression type definitions
@types/multer              # Multer type definitions
```

---

## Security

- University email domain validation (`@chitkara.edu.in` only)
- OTPs hashed with bcrypt, stored in Redis with 5-min TTL
- Brute-force protection: 3 OTP attempts, 15-min lockout
- JWT access tokens (15 min) + refresh tokens (7 days) in httpOnly cookies
- Helmet.js security headers
- Input sanitization against XSS and SQL injection (Prisma uses parameterized queries by default)
- Rate limiting: 10 OTP requests / 15 min, 10 AI requests / min, 100 general / min
- CORS restricted to frontend domain only
- No PII in application logs

---

## Scripts

```bash
# Client
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint

# Server
npm run dev          # Start with tsx watch (auto-reload on .ts changes)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled JS from dist/
npm run lint         # ESLint

# Prisma
npx prisma generate  # Generate Prisma client after schema changes
npx prisma migrate dev --name <migration_name>   # Create & apply migration
npx prisma migrate deploy                        # Apply migrations in production
npx prisma studio    # Open visual DB browser (dev only)
npx prisma db seed   # Run seed script (if configured)
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/template-selector`)
3. Commit changes (`git commit -m 'Add template selector page'`)
4. Push to branch (`git push origin feature/template-selector`)
5. Open a Pull Request

---

## License

This project is built for internal university use. All rights reserved.

---

## Team

Built by students of **Chitkara University** as a prototype to standardize resume quality across the campus.
