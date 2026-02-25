# 📄 UniResume — University Resume Builder

A structured, AI-enhanced resume builder designed to solve the lack of standardized, ATS-friendly resume templates for university students. Students fill a guided multi-step form, select from 5 pre-built templates, and download polished, ATS-compliant resumes.

> **Status:** Prototype

---

## Problem Statement

Students in our university have no fixed resume templates, leading to inconsistent formatting and poor ATS (Applicant Tracking System) compatibility. UniResume provides a guided flow that guarantees every resume is structured, professional, and ATS-friendly — regardless of the student's design skills.

---

## Features

- **OTP-Based Auth** — Students verify via university email (`@university.edu`)
- **5-Step Guided Form** — Personal Details → Academics → Skills & Projects → Experience & Achievements → Hobbies & Summary
- **5 ATS-Compliant Templates** — Classic, Modern, Minimal, Academic, Technical
- **AI Content Generation** — Auto-generate professional summaries and enhance bullet points (OpenAI GPT)
- **ATS Checker** — Hybrid rule-based + AI scoring with actionable suggestions
- **PDF Download** — Server-side PDF generation via Puppeteer
- **Auto-Save** — Debounced saves so students never lose progress
- **Profile Photo Upload** — Optional image support

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Frontend     | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand |
| Backend      | Express.js, Node.js 20+            |
| Database     | MongoDB (Mongoose)                  |
| Cache        | Redis                               |
| AI           | OpenAI API (GPT-4o / GPT-4o-mini)  |
| PDF          | Puppeteer                           |
| Email        | Nodemailer                          |
| File Storage | AWS S3 / MinIO                      |
| Deployment   | Docker, Nginx                       |

---

## Project Structure

```
uni-resume/
├── client/                       # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/            # Email entry
│   │   │   └── verify/           # OTP verification
│   │   ├── (protected)/
│   │   │   ├── form/
│   │   │   │   ├── personal/     # Step 1: Personal Details
│   │   │   │   ├── academic/     # Step 2: Academic Info
│   │   │   │   ├── skills/       # Step 3: Skills & Projects
│   │   │   │   ├── experience/   # Step 4: Experience & Achievements
│   │   │   │   └── summary/      # Step 5: Hobbies & Summary
│   │   │   ├── templates/        # Template selection
│   │   │   └── preview/          # Preview, edit & download
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── form/                 # Form step components
│   │   ├── templates/            # 5 resume template components
│   │   └── common/               # Header, Stepper, etc.
│   ├── store/
│   │   └── resumeStore.ts        # Zustand state management
│   ├── lib/
│   │   ├── api.ts                # Axios instance
│   │   └── validators.ts         # Zod validation schemas
│   └── middleware.ts             # Auth route protection
│
├── server/                       # Express.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # MongoDB connection
│   │   │   ├── redis.js          # Redis connection
│   │   │   └── env.js            # Env variable validation
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification
│   │   │   ├── rateLimiter.js    # Rate limiting
│   │   │   ├── validate.js       # Request validation
│   │   │   └── errorHandler.js   # Global error handler
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
│   │   │   ├── ai.service.js     # OpenAI API wrapper
│   │   │   ├── pdf.service.js    # Puppeteer PDF generation
│   │   │   └── ats.service.js    # ATS scoring engine
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Resume.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   └── logger.js
│   │   └── server.js
│   ├── templates/                # Handlebars templates for PDF
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis
- OpenAI API key
- SMTP credentials (Gmail App Password / SendGrid / Mailtrap for dev)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/uni-resume.git
cd uni-resume
```

### 2. Environment Variables

Create `.env` files in both `client/` and `server/` directories:

**`server/.env`**

```env
# Server
PORT=4000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/uniresume

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
S3_BUCKET=uniresume-uploads
S3_REGION=ap-south-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Allowed Email Domain
ALLOWED_EMAIL_DOMAIN=university.edu
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

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Frontend runs on `http://localhost:3000`, Backend on `http://localhost:4000`.

### 5. Run with Docker (Optional)

```bash
docker-compose up --build
```

---

## API Endpoints

### Auth

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | `/api/auth/send-otp`  | Send OTP to uni email  |
| POST   | `/api/auth/verify-otp`| Verify OTP, return JWT |
| POST   | `/api/auth/refresh`   | Refresh access token   |
| POST   | `/api/auth/logout`    | Invalidate session     |

### Resume (Protected)

| Method | Endpoint                          | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | `/api/resume`                     | Create new resume            |
| GET    | `/api/resume/:id`                 | Get resume data              |
| PATCH  | `/api/resume/:id/step/:step`      | Save a specific form step    |
| PUT    | `/api/resume/:id/template`        | Set selected template        |
| GET    | `/api/resume/:id/preview`         | Get rendered HTML preview    |
| POST   | `/api/resume/:id/download`        | Generate & download PDF      |

### AI (Protected + Rate Limited)

| Method | Endpoint                     | Description                        |
| ------ | ---------------------------- | ---------------------------------- |
| POST   | `/api/ai/generate-summary`   | Generate professional summary      |
| POST   | `/api/ai/enhance-text`       | Improve a bullet point             |
| POST   | `/api/ai/ats-check`          | Run ATS compatibility check        |

### Upload (Protected)

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| POST   | `/api/upload/photo`     | Upload profile photo |
| DELETE | `/api/upload/photo/:key`| Delete photo         |

---

## User Flow

```
1. Landing Page
   └──▶ 2. Enter University Email
         └──▶ 3. Verify OTP
               └──▶ 4. Multi-Step Form
                     ├── Step 1: Personal Details (Name, DOB, Location, LinkedIn, GitHub...)
                     ├── Step 2: Academic Info (University, Stream, CGPA, 10th/12th marks...)
                     ├── Step 3: Skills & Projects (Skill tags, Project entries...)
                     ├── Step 4: Experience & Achievements (Internships, Competitions...)
                     └── Step 5: Hobbies & Summary (Interests, AI-generated summary)
                           └──▶ 5. Select Template
                                 └──▶ 6. Preview & Minor Edits
                                       └──▶ 7. Download PDF
```

---

## Templates

| # | Template     | Best For                        | Layout        |
|---|------------- |---------------------------------|---------------|
| 1 | Classic      | General purpose, traditional    | Single column, serif font |
| 2 | Modern       | Clean, contemporary look        | Sans-serif, color accent  |
| 3 | Minimal      | Maximum readability             | Lots of whitespace        |
| 4 | Academic     | Research / higher-ed focused    | Education-first ordering  |
| 5 | Technical    | CS / Engineering students       | Skills-prominent, project-heavy |

All templates are ATS-compliant by design: single-column layouts, standard section headings, system fonts, no text-in-images, proper heading hierarchy.

---

## AI Features (OpenAI)

### Summary Generation

Collects data from all form steps and generates a 2-3 sentence professional summary using GPT-4o-mini. Students can regenerate or manually edit.

### Bullet Enhancement

Each project and experience entry has an "Improve with AI" button that rewrites the description with strong action verbs and quantified impact.

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
express
mongoose                   # MongoDB ODM
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
express-mongo-sanitize     # NoSQL injection prevention
winston                    # Logging
compression                # Response compression
```

---

## Security

- University email domain validation (`@university.edu` only)
- OTPs hashed with bcrypt, stored in Redis with 5-min TTL
- Brute-force protection: 3 OTP attempts, 15-min lockout
- JWT access tokens (15 min) + refresh tokens (7 days) in httpOnly cookies
- Helmet.js security headers
- Input sanitization against XSS and NoSQL injection
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
npm run dev          # Start with nodemon
npm run start        # Start production server
npm run lint         # ESLint
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

Built by students of **[Your University Name]** as a prototype to standardize resume quality across the campus.
