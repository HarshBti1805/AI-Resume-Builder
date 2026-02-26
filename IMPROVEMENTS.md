# ChitkaraCV — Comprehensive Improvement Plan

## Executive Summary

This document details 7 major improvements to transform ChitkaraCV from a basic form-to-PDF prototype into a **professional resume IDE** with live preview, AI-powered editing, resume upload/parsing, and ATS-optimized output matching the quality of your reference resume (Harsh Singla's resume).

---

## Improvement 1: Template Selection Before Form + Live Side-by-Side Preview

### Current Problem
Users fill out the entire form blindly, then pick a template at the end — they can't see how their data looks until the very last step. This creates a disconnected experience and wastes time if the chosen template doesn't suit their content.

### Solution Architecture

**New User Flow:**
```
Landing → Auth → Template Selection → Multi-Step Form (with live preview) → Final Review/Edit → Download
```

**Split-Screen Layout During Form:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Stepper: [1. Personal] [2. Academic] [3. Projects] [4. Exp] [5]   │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                      │
│   FORM INPUT (Left Panel)    │   LIVE RESUME PREVIEW (Right Panel)  │
│   ~50% width                 │   ~50% width                         │
│                              │                                      │
│   [Name: ___________]        │   ┌────────────────────────────┐     │
│   [Phone: __________]        │   │       Harsh Singla          │     │
│   [Email: __________]        │   │  Bathinda | email | phone   │     │
│                              │   │                              │     │
│                              │   │  Projects & Work Experience  │     │
│                              │   │  • Heritage Threads: ...     │     │
│                              │   │  • Vidhur: ...               │     │
│                              │   │                              │     │
│                              │   │  Skills                      │     │
│                              │   │  • Languages: C, C++...      │     │
│                              │   └────────────────────────────┘     │
│                              │                                      │
│  [← Back]         [Next →]   │   [Change Template ▾]                │
└──────────────────────────────┴──────────────────────────────────────┘
```

### Frontend Implementation

**New Page: `/templates/select` (comes before the form)**

```tsx
// app/(protected)/templates/select/page.tsx
"use client";
import { useResumeStore } from "@/store/resumeStore";
import { useRouter } from "next/navigation";
import { TemplateType } from "@/types";

const TEMPLATES: { id: TemplateType; name: string; description: string; preview: string }[] = [
  {
    id: "CLASSIC",
    name: "Classic",
    description: "Traditional single-column layout. Clean sections, standard fonts. Best for conservative industries.",
    preview: "/previews/classic.png",
  },
  {
    id: "MODERN",
    name: "Modern",
    description: "Two-column layout with accent colors. Visual skill bars. Great for tech roles.",
    preview: "/previews/modern.png",
  },
  {
    id: "MINIMAL",
    name: "Minimal",
    description: "Maximum whitespace, monospaced headings. For when your content speaks for itself.",
    preview: "/previews/minimal.png",
  },
  {
    id: "ACADEMIC",
    name: "Academic",
    description: "Emphasis on education, coursework, and publications. Ideal for research-oriented students.",
    preview: "/previews/academic.png",
  },
  {
    id: "TECHNICAL",
    name: "Technical",
    description: "ATS-optimized, dense but readable. Bullet-point heavy. Mirrors the format used by top engineering resumes.",
    preview: "/previews/technical.png",
  },
];

export default function TemplateSelectPage() {
  const { setTemplate, selectedTemplate } = useResumeStore();
  const router = useRouter();

  const handleSelect = (template: TemplateType) => {
    setTemplate(template);
    router.push("/form/personal"); // Go to first form step
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Choose Your Template</h1>
      <p className="text-muted-foreground mb-8">
        Pick a starting template. You can always change it later during editing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
              selectedTemplate === t.id ? "border-primary ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <img src={t.preview} alt={t.name} className="w-full h-64 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Split-Screen Form Layout:**

```tsx
// app/(protected)/form/layout.tsx
"use client";
import { Stepper } from "@/components/form/Stepper";
import { LivePreview } from "@/components/preview/LivePreview";
import { useResumeStore } from "@/store/resumeStore";
import { useState } from "react";

export default function FormLayout({ children }: { children: React.ReactNode }) {
  const resumeData = useResumeStore();
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Stepper />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Form */}
        <div
          className={`overflow-y-auto p-6 transition-all ${
            previewCollapsed ? "w-full" : "w-1/2 border-r"
          }`}
        >
          {children}
        </div>

        {/* Right: Live Preview */}
        {!previewCollapsed && (
          <div className="w-1/2 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 relative">
            <button
              onClick={() => setPreviewCollapsed(true)}
              className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Hide Preview
            </button>
            <LivePreview data={resumeData} />
          </div>
        )}

        {previewCollapsed && (
          <button
            onClick={() => setPreviewCollapsed(false)}
            className="fixed right-4 bottom-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg"
          >
            Show Preview
          </button>
        )}
      </div>
    </div>
  );
}
```

**LivePreview Component (renders selected template with current Zustand data):**

```tsx
// components/preview/LivePreview.tsx
"use client";
import { ResumeData } from "@/types";
import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import { ModernTemplate } from "@/components/templates/ModernTemplate";
import { MinimalTemplate } from "@/components/templates/MinimalTemplate";
import { AcademicTemplate } from "@/components/templates/AcademicTemplate";
import { TechnicalTemplate } from "@/components/templates/TechnicalTemplate";

const TEMPLATE_MAP = {
  CLASSIC: ClassicTemplate,
  MODERN: ModernTemplate,
  MINIMAL: MinimalTemplate,
  ACADEMIC: AcademicTemplate,
  TECHNICAL: TechnicalTemplate,
};

interface Props {
  data: ResumeData;
}

export function LivePreview({ data }: Props) {
  const Template = TEMPLATE_MAP[data.selectedTemplate || "CLASSIC"];

  return (
    <div className="mx-auto" style={{ maxWidth: "210mm" }}>
      {/* Scale the A4 preview to fit the panel */}
      <div
        className="bg-white shadow-lg origin-top"
        style={{
          width: "210mm",
          minHeight: "297mm",
          transform: "scale(0.55)",
          transformOrigin: "top left",
        }}
      >
        <Template data={data} />
      </div>
    </div>
  );
}
```

### Key Implementation Notes

- The preview uses the **same React template components** used for final PDF generation — single source of truth.
- Preview re-renders on every Zustand state change (which is debounced from form input).
- CSS `transform: scale()` is used to fit A4-sized content into the side panel. The scale factor should be computed dynamically: `panelWidth / 210mm`.
- Mobile: Collapse to tabs (Form | Preview) instead of side-by-side.

---

## Improvement 2: Template Switching at End of Form

### Solution

Add a floating "Change Template" control that's always visible during form filling AND on the final review page.

```tsx
// components/form/TemplateSwitch.tsx
"use client";
import { useResumeStore } from "@/store/resumeStore";
import { TemplateType } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const templates: { value: TemplateType; label: string }[] = [
  { value: "CLASSIC", label: "Classic" },
  { value: "MODERN", label: "Modern" },
  { value: "MINIMAL", label: "Minimal" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "TECHNICAL", label: "Technical" },
];

export function TemplateSwitch() {
  const { selectedTemplate, setTemplate } = useResumeStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Template:</span>
      <Select value={selectedTemplate || "CLASSIC"} onValueChange={(v) => setTemplate(v as TemplateType)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

This component sits in the preview panel header and on the final `/preview` page. Changing the template instantly re-renders the LivePreview component since it reads `selectedTemplate` from the store.

---

## Improvement 3: AI Resume Editor — IDE-Like Split-Screen Editing Room

### Concept

After the form flow is complete, users enter the **Editing Room** — a VS-Code-inspired split-screen editor where the left panel is a structured content editor (not a raw text editor) and the right panel is the live rendered resume.

### UI Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  [← Back to Form]  Editing Room           [Template ▾] [Download ↓] │
├──────────────────────────────────┬───────────────────────────────────┤
│                                  │                                   │
│  STRUCTURED EDITOR (Left)        │  LIVE PREVIEW (Right)             │
│                                  │                                   │
│  ┌──────────────────────────┐    │                                   │
│  │ 📋 Section: Personal Info │    │   ┌──────────────────────────┐    │
│  │ [↑↓ drag to reorder]     │    │   │     Harsh Singla          │    │
│  │ Name: [Harsh Singla    ] │    │   │  email | phone | location │    │
│  │ Email: [singla@gmail.. ] │    │   │                            │    │
│  │ Phone: [(+91) 96467... ] │    │   │  Projects & Experience     │    │
│  └──────────────────────────┘    │   │  ________________________  │    │
│                                  │   │                            │    │
│  ┌──────────────────────────┐    │   │  Heritage Threads          │    │
│  │ 📋 Section: Projects      │    │   │  • Engineered a scalable...│    │
│  │ [↑↓ drag to reorder]     │    │   │  • Integrated Cloudinary...│    │
│  │ [+ Add Project]           │    │   │                            │    │
│  │                           │    │   │  Skills                    │    │
│  │ ▼ Heritage Threads        │    │   │  • Languages: C, C++...   │    │
│  │   Title: [Heritage...  ]  │    │   │  • Frameworks: React...   │    │
│  │   Link:  [github.com/.]  │    │   │                            │    │
│  │   Bullets:                │    │   │  Certifications            │    │
│  │   • [Engineered a...]    │    │   │  • Second Runner-Up...     │    │
│  │   • [Integrated Clou.]   │    │   │                            │    │
│  │   [+ Add Bullet] [🤖 AI] │    │   │  Education                 │    │
│  │                           │    │   │  Chitkara University       │    │
│  │ ▼ Vidhur                  │    │   │  B.E. CSE | CGPA: 9.80    │    │
│  │   ...                     │    │   └──────────────────────────┘    │
│  └──────────────────────────┘    │                                   │
│                                  │                                   │
│  ┌──────────────────────────┐    │                                   │
│  │ 📋 + Add Custom Section   │    │                                   │
│  └──────────────────────────┘    │                                   │
│                                  │                                   │
│  Font: [Georgia ▾] Size: [11 ▾] │                                   │
│  Accent Color: [■ #2563EB]      │                                   │
└──────────────────────────────────┴───────────────────────────────────┘
```

### Key Features

**a) Section Reordering (Drag & Drop)**

```tsx
// Using @dnd-kit/sortable for accessible drag-and-drop
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";

interface Section {
  id: string;
  type: "personal" | "education" | "projects" | "experience" | "skills" | "achievements" | "custom";
  label: string;
  visible: boolean;
}

// Default section order
const DEFAULT_SECTIONS: Section[] = [
  { id: "personal", type: "personal", label: "Personal Info", visible: true },
  { id: "projects", type: "projects", label: "Projects and Work Experience", visible: true },
  { id: "skills", type: "skills", label: "Technology Stack and Skills", visible: true },
  { id: "achievements", type: "achievements", label: "Certifications & Communities", visible: true },
  { id: "education", type: "education", label: "Education", visible: true },
];

// Store section order in Zustand
interface ResumeEditorState {
  sections: Section[];
  reorderSections: (activeId: string, overId: string) => void;
  toggleSectionVisibility: (id: string) => void;
  addCustomSection: (label: string) => void;
}
```

**b) Font & Style Controls**

```tsx
// components/editor/StyleControls.tsx
interface ResumeStyles {
  fontFamily: string;      // "Georgia" | "Calibri" | "Times New Roman" | "Garamond" | "Helvetica"
  fontSize: number;        // 10 | 11 | 12
  headingSize: number;     // 12 | 14 | 16
  accentColor: string;     // hex color for section headers, links
  lineSpacing: number;     // 1.0 | 1.15 | 1.25 | 1.5
  margins: "narrow" | "normal" | "wide"; // 0.5in | 0.75in | 1.0in
  sectionDivider: "line" | "space" | "bold-heading" | "none";
}

const FONT_OPTIONS = [
  { value: "Georgia", label: "Georgia (Serif — Classic)" },
  { value: "Calibri", label: "Calibri (Sans — Modern)" },
  { value: "Times New Roman", label: "Times New Roman (Serif — Traditional)" },
  { value: "Garamond", label: "Garamond (Serif — Elegant)" },
  { value: "Helvetica", label: "Helvetica (Sans — Clean)" },
  { value: "Cambria", label: "Cambria (Serif — Professional)" },
];
```

**c) Custom Section Support**

```tsx
// When user clicks "+ Add Custom Section"
const addCustomSection = (label: string) => {
  const newSection: Section = {
    id: `custom-${Date.now()}`,
    type: "custom",
    label,
    visible: true,
  };
  set((state) => ({
    sections: [...state.sections, newSection],
    customSections: {
      ...state.customSections,
      [newSection.id]: {
        title: label,
        items: [],  // Array of { text: string } — bullet points
      },
    },
  }));
};
```

### Updated Prisma Schema for Editor Features

```prisma
model Resume {
  // ... existing fields ...

  // NEW: Editor customization
  sectionOrder    String[]       @default([])  // ordered section IDs
  fontFamily      String?        @default("Georgia")
  fontSize        Int?           @default(11)
  headingSize     Int?           @default(14)
  accentColor     String?        @default("#000000")
  lineSpacing     Float?         @default(1.15)
  marginSize      String?        @default("normal")  // "narrow" | "normal" | "wide"
  sectionDivider  String?        @default("line")

  // Relations
  customSections  CustomSection[]
  // ... existing relations ...
}

model CustomSection {
  id        String   @id @default(uuid())
  resume    Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId  String
  title     String
  sortOrder Int      @default(0)
  items     CustomSectionItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([resumeId])
}

model CustomSectionItem {
  id              String        @id @default(uuid())
  section         CustomSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  sectionId       String
  text            String        @db.Text
  sortOrder       Int           @default(0)
  createdAt       DateTime      @default(now())

  @@index([sectionId])
}
```

### New API Endpoints

```
PUT    /api/resume/:id/sections/order      → Reorder sections
POST   /api/resume/:id/sections/custom     → Add custom section
PATCH  /api/resume/:id/sections/custom/:sId → Update custom section
DELETE /api/resume/:id/sections/custom/:sId → Delete custom section
PUT    /api/resume/:id/styles              → Update font/color/spacing
```

---

## Improvement 4: Extended AI Support in Editing Room

### AI Integration Points

The AI should be available at **every editable text field** in the editor, not just the summary.

```
┌─────────────────────────────────────────────────────────┐
│  Project: Heritage Threads                               │
│  Bullet 1: [Engineered a scalable MERN stack plat...]   │
│            [🤖 Improve] [🤖 Add Keywords] [🤖 Shorten]  │
│                                                          │
│  Bullet 2: [Integrated Cloudinary for image/video...]   │
│            [🤖 Improve] [🤖 Add Keywords] [🤖 Shorten]  │
│                                                          │
│  [+ Add Bullet]  [🤖 Generate Bullet from Description]  │
│                                                          │
│  ─────────────────────────────────────────────────       │
│  Section-Level AI:                                       │
│  [🤖 Refine All Bullets] [🤖 ATS Keyword Scan]          │
│  [🤖 Suggest Missing Keywords]                           │
└─────────────────────────────────────────────────────────┘
```

### New AI Service Functions

```typescript
// server/src/services/ai.service.ts — New additions

/** Improve a single bullet point with action verbs and quantification */
export const improveBullet = async (
  bullet: string,
  context: { projectTitle: string; techStack: string[]; role?: string }
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert resume writer specializing in ATS-optimized resumes for software engineering students.
Rules:
- Start every bullet with a strong action verb (Engineered, Developed, Integrated, Optimized, etc.)
- Include quantifiable metrics where possible (%, Xs faster, K+ users, etc.)
- Mention specific technologies naturally within the description
- Keep each bullet to 1-2 lines (max 25 words)
- Never exaggerate — only refine what's given
- Maintain technical accuracy`,
      },
      {
        role: "user",
        content: `Improve this resume bullet point.
Project: ${context.projectTitle}
Tech Stack: ${context.techStack.join(", ")}
${context.role ? `Role: ${context.role}` : ""}
Original: "${bullet}"
Return only the improved bullet text, no quotes.`,
      },
    ],
    max_tokens: 100,
    temperature: 0.6,
  });
  return response.choices[0].message.content?.trim() ?? bullet;
};

/** Add relevant ATS keywords to a bullet without changing its meaning */
export const addKeywords = async (
  bullet: string,
  context: { targetRole: string; existingSkills: string[] }
): Promise<{ improved: string; addedKeywords: string[] }> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You add relevant ATS keywords to resume bullet points. Return JSON only: { "improved": "...", "addedKeywords": ["keyword1", "keyword2"] }
Rules:
- Naturally weave in 1-3 relevant technical keywords
- Don't change the core meaning
- Keywords should be genuinely relevant to the work described
- Don't add generic filler terms`,
      },
      {
        role: "user",
        content: `Bullet: "${bullet}"
Target Role: ${context.targetRole}
Already mentioned skills: ${context.existingSkills.join(", ")}`,
      },
    ],
    max_tokens: 150,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content ?? '{"improved":"","addedKeywords":[]}');
};

/** Generate bullet points from a raw project description */
export const generateBulletsFromDescription = async (
  description: string,
  techStack: string[],
  count: number = 4
): Promise<string[]> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You convert raw project descriptions into ATS-optimized resume bullet points.
Return a JSON array of strings. Each bullet:
- Starts with an action verb
- Is 15-25 words
- Mentions specific technologies from the tech stack
- Includes quantifiable impact where reasonable
- Is unique (no two bullets should start with the same verb)`,
      },
      {
        role: "user",
        content: `Description: "${description}"
Tech Stack: ${techStack.join(", ")}
Generate exactly ${count} bullets. Return JSON array of strings only.`,
      },
    ],
    max_tokens: 400,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  const parsed = JSON.parse(response.choices[0].message.content ?? '{"bullets":[]}');
  return parsed.bullets || parsed;
};

/** Refine the entire resume for ATS optimization */
export const refineFullResume = async (
  resumeData: FullResumeData
): Promise<{
  suggestions: { section: string; original: string; improved: string; reason: string }[];
  missingKeywords: string[];
  overallScore: number;
}> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an ATS resume optimization expert. Analyze the full resume and return JSON:
{
  "suggestions": [{ "section": "projects", "original": "...", "improved": "...", "reason": "..." }],
  "missingKeywords": ["keyword1", "keyword2"],
  "overallScore": 85
}
Only suggest changes that meaningfully improve ATS compatibility. Max 5 suggestions.`,
      },
      {
        role: "user",
        content: `Resume data: ${JSON.stringify(resumeData)}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.4,
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content ?? "{}");
};
```

### New API Routes

```
POST   /api/ai/improve-bullet          → Improve a single bullet point
POST   /api/ai/add-keywords            → Add ATS keywords to text
POST   /api/ai/generate-bullets        → Generate bullets from description
POST   /api/ai/refine-resume           → Full resume analysis & suggestions
```

### Frontend: AI Button Component

```tsx
// components/editor/AIButton.tsx
"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  label: string;
  onResult: (result: string) => void;
  apiCall: () => Promise<string>;
}

export function AIButton({ label, onResult, apiCall }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      setPreview(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-50 
                   text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        {label}
      </button>
      
      {preview && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-900">{preview}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { onResult(preview); setPreview(null); }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Accept
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Improvement 5: Resume Upload & Reuse

### User Flow

```
Landing → Auth → "How would you like to start?"
                  ├── [📄 Upload Existing Resume]  → Parse → Pre-fill form → Choose template → Edit
                  └── [✨ Start from Scratch]        → Choose template → Multi-step form → Edit
```

### Resume Parsing Pipeline

```
Upload PDF/DOCX
      │
      ▼
Extract Text (pdftotext / Pandoc)
      │
      ▼
OpenAI Structured Extraction
      │
      ▼
Map to Resume Schema
      │
      ▼
Pre-fill Zustand Store
      │
      ▼
User Reviews & Edits in Form
```

### Backend: Resume Parser Service

```typescript
// server/src/services/parser.service.ts
import OpenAI from "openai";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ParsedResume {
  fullName: string | null;
  phone: string | null;
  contactEmail: string | null;
  city: string | null;
  state: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  university: string | null;
  stream: string | null;
  branch: string | null;
  batchStart: number | null;
  batchEnd: number | null;
  cgpa: number | null;
  skills: string[];
  projects: {
    title: string;
    description: string;  // This will be the full description or first bullet
    bullets: string[];     // Individual bullet points
    techStack: string[];
    liveUrl: string | null;
    repoUrl: string | null;
  }[];
  internships: {
    company: string;
    role: string;
    description: string;
    bullets: string[];
    startDate: string | null;
    endDate: string | null;
  }[];
  achievements: {
    title: string;
    description: string | null;
    type: "COMPETITION" | "CERTIFICATION" | "HACKATHON" | "PUBLICATION" | "OTHER";
  }[];
  hobbies: string[];
  summary: string | null;
}

export const parseResumeFromFile = async (filePath: string): Promise<ParsedResume> => {
  // Step 1: Extract raw text
  const ext = filePath.split(".").pop()?.toLowerCase();
  let rawText: string;

  if (ext === "pdf") {
    const { stdout } = await execAsync(`pdftotext -layout "${filePath}" -`);
    rawText = stdout;
  } else if (ext === "docx") {
    const { stdout } = await execAsync(`pandoc "${filePath}" -t plain`);
    rawText = stdout;
  } else {
    throw new AppError("Unsupported file format. Upload PDF or DOCX.", 400, "INVALID_FORMAT");
  }

  // Step 2: AI-powered structured extraction
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a resume parser. Extract structured data from raw resume text.
Return ONLY valid JSON matching this schema exactly:
{
  "fullName": string | null,
  "phone": string | null,
  "contactEmail": string | null,
  "city": string | null,
  "state": string | null,
  "linkedin": string | null,
  "github": string | null,
  "portfolio": string | null,
  "university": string | null,
  "stream": string | null,
  "branch": string | null,
  "batchStart": number | null,
  "batchEnd": number | null,
  "cgpa": number | null,
  "skills": string[],
  "projects": [{ "title": string, "description": string, "bullets": string[], "techStack": string[], "liveUrl": string | null, "repoUrl": string | null }],
  "internships": [{ "company": string, "role": string, "description": string, "bullets": string[], "startDate": string | null, "endDate": string | null }],
  "achievements": [{ "title": string, "description": string | null, "type": "COMPETITION" | "CERTIFICATION" | "HACKATHON" | "PUBLICATION" | "OTHER" }],
  "hobbies": string[],
  "summary": string | null
}

Important:
- For projects, keep each bullet point as a separate entry in the "bullets" array
- Extract tech stack from project descriptions if not explicitly listed
- "skills" should be a flat array of individual skill names (not categories)
- For skills organized by category (e.g., "Languages: C, C++"), still flatten to individual skills but preserve the category info by prefixing: ["Languages: C", "Languages: C++", ...] — NO, just flat: ["C", "C++", ...]
- For skills, also store the original category groupings separately if present`,
      },
      {
        role: "user",
        content: rawText,
      },
    ],
    max_tokens: 2000,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content ?? "{}");
};
```

### New API Route

```
POST   /api/resume/upload-parse     → Upload PDF/DOCX, return parsed data
```

### Frontend: Upload Choice Page

```tsx
// app/(protected)/start/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Upload, Sparkles } from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";

export default function StartPage() {
  const router = useRouter();
  const { prefillFromParsed } = useResumeStore();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resume/upload-parse", { method: "POST", body: formData });
      const { data } = await res.json();
      prefillFromParsed(data); // Fills Zustand store with parsed data
      router.push("/templates/select"); // Let them choose a template for the parsed data
    } catch (err) {
      toast.error("Failed to parse resume. Try a different file or start from scratch.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 flex flex-col items-center gap-8 mt-20">
      <h1 className="text-3xl font-bold text-center">How would you like to start?</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <label className="cursor-pointer border-2 border-dashed rounded-xl p-8 text-center
                          hover:border-primary hover:bg-primary/5 transition-all">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Upload Existing Resume</h3>
          <p className="text-sm text-muted-foreground">
            We'll extract your info and let you choose a new template
          </p>
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
        </label>

        <button
          onClick={() => router.push("/templates/select")}
          className="border-2 rounded-xl p-8 text-center hover:border-primary
                     hover:bg-primary/5 transition-all"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Start from Scratch</h3>
          <p className="text-sm text-muted-foreground">
            Build your resume step-by-step with our guided form
          </p>
        </button>
      </div>
    </div>
  );
}
```

### Updated Prisma Schema

```prisma
model Resume {
  // ... existing fields ...
  
  // NEW: Track origin
  origin          ResumeOrigin   @default(SCRATCH)
  originalFileUrl String?        // S3 URL of uploaded original
}

enum ResumeOrigin {
  SCRATCH
  UPLOADED
}
```

---

## Improvement 6: Improved Form Fields — Bullet-Point Project Descriptions

### Current Problem
The project `description` field is a single `String @db.Text` — a plain textarea. For student resumes (and matching your reference resume), projects need **structured bullet points**, each individually editable and AI-enhanceable.

### Your Reference Resume Structure (to match)

```
Heritage Threads: AI-powered eCommerce platform for Indian clothing          Link
• Engineered a scalable MERN stack platform designed to support product scaling...
• Integrated Cloudinary for image/video storage, reducing load times by 40%...
• Built an AI chatbot & recommendation engine using Gemini API, increasing...
• Enhanced front-end speed by refactoring Redux middleware, trimming down...
```

Key observations:
- **Title + subtitle** on the same line, with a right-aligned link
- **3-5 bullet points** per project, each starting with an action verb
- Bullets are 1-2 lines, contain metrics and specific technologies
- No paragraph descriptions — entirely bullet-based

### Updated Prisma Schema for Bullet Points

```prisma
model Project {
  id          String          @id @default(uuid())
  resume      Resume          @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  title       String                          // "Heritage Threads"
  subtitle    String?                         // "AI-powered eCommerce platform for Indian clothing"
  techStack   String[]        @default([])
  liveUrl     String?
  repoUrl     String?
  startDate   DateTime?
  endDate     DateTime?
  sortOrder   Int             @default(0)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  bullets     ProjectBullet[]                 // Replaces single 'description' field

  @@index([resumeId])
}

model ProjectBullet {
  id         String   @id @default(uuid())
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId  String
  text       String   @db.Text               // "Engineered a scalable MERN stack platform..."
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([projectId])
}

// Same pattern for internships
model Internship {
  id          String              @id @default(uuid())
  resume      Resume              @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  company     String
  role        String
  startDate   DateTime?
  endDate     DateTime?
  sortOrder   Int                 @default(0)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  bullets     InternshipBullet[]  // Replaces single 'description' field

  @@index([resumeId])
}

model InternshipBullet {
  id            String      @id @default(uuid())
  internship    Internship  @relation(fields: [internshipId], references: [id], onDelete: Cascade)
  internshipId  String
  text          String      @db.Text
  sortOrder     Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([internshipId])
}
```

### Frontend: Bullet Point Editor Component

```tsx
// components/form/BulletEditor.tsx
"use client";
import { useState } from "react";
import { Plus, GripVertical, Trash2, Sparkles } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AIButton } from "@/components/editor/AIButton";

interface Bullet {
  id: string;
  text: string;
  sortOrder: number;
}

interface Props {
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
  context: { projectTitle: string; techStack: string[] };
}

function SortableBullet({
  bullet,
  onUpdate,
  onDelete,
  context,
}: {
  bullet: Bullet;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  context: Props["context"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bullet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 group mb-2">
      <button {...attributes} {...listeners} className="mt-2 cursor-grab opacity-0 group-hover:opacity-100">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="mt-2 text-muted-foreground">•</span>
      <div className="flex-1">
        <textarea
          value={bullet.text}
          onChange={(e) => onUpdate(bullet.id, e.target.value)}
          rows={2}
          className="w-full resize-none border rounded-md px-3 py-2 text-sm focus:ring-2 
                     focus:ring-primary/20 focus:border-primary"
          placeholder="Start with an action verb: Developed, Engineered, Integrated..."
        />
        <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AIButton
            label="Improve"
            onResult={(result) => onUpdate(bullet.id, result)}
            apiCall={() => improveBulletAPI(bullet.text, context)}
          />
          <AIButton
            label="Add Keywords"
            onResult={(result) => onUpdate(bullet.id, result)}
            apiCall={() => addKeywordsAPI(bullet.text, context)}
          />
          <button
            onClick={() => onDelete(bullet.id)}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulletEditor({ bullets, onChange, context }: Props) {
  const addBullet = () => {
    onChange([
      ...bullets,
      { id: `bullet-${Date.now()}`, text: "", sortOrder: bullets.length },
    ]);
  };

  const updateBullet = (id: string, text: string) => {
    onChange(bullets.map((b) => (b.id === id ? { ...b, text } : b)));
  };

  const deleteBullet = (id: string) => {
    onChange(bullets.filter((b) => b.id !== id));
  };

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bullets.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {bullets.map((bullet) => (
            <SortableBullet
              key={bullet.id}
              bullet={bullet}
              onUpdate={updateBullet}
              onDelete={deleteBullet}
              context={context}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2 mt-3">
        <button
          onClick={addBullet}
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Bullet Point
        </button>
        <button
          onClick={() => generateBulletsFromDescriptionAPI(context)}
          className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4" /> AI: Generate Bullets
        </button>
      </div>
    </div>
  );
}
```

### Updated Project Form Section

```tsx
// app/(protected)/form/projects/page.tsx (relevant section)
// Each project card now includes:
// - Title field
// - Subtitle field (optional tagline)
// - Tech Stack tags input
// - Live URL + Repo URL
// - BulletEditor component (replaces single textarea)
// - Date range picker

<div className="space-y-6">
  {projects.map((project, index) => (
    <div key={project.id} className="border rounded-xl p-6 space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Project Title *</label>
          <input
            value={project.title}
            onChange={(e) => updateProject(project.id, "title", e.target.value)}
            placeholder="Heritage Threads"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Subtitle / Tagline</label>
          <input
            value={project.subtitle}
            onChange={(e) => updateProject(project.id, "subtitle", e.target.value)}
            placeholder="AI-powered eCommerce platform for Indian clothing"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Tech Stack</label>
        <TagInput
          tags={project.techStack}
          onChange={(tags) => updateProject(project.id, "techStack", tags)}
          placeholder="Type a technology and press Enter..."
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Live URL</label>
          <input value={project.liveUrl} onChange={...} placeholder="https://..." className="..." />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Repository URL</label>
          <input value={project.repoUrl} onChange={...} placeholder="https://github.com/..." className="..." />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Bullet Points *</label>
        <p className="text-xs text-muted-foreground mb-2">
          3-5 bullets recommended. Start each with an action verb. Include metrics when possible.
        </p>
        <BulletEditor
          bullets={project.bullets}
          onChange={(bullets) => updateProject(project.id, "bullets", bullets)}
          context={{ projectTitle: project.title, techStack: project.techStack }}
        />
      </div>
    </div>
  ))}
</div>
```

---

## Improvement 7: Hobbies with Descriptions + Improved Form Fields

### Hobbies Enhancement

Your reference resume doesn't have a hobbies section (it uses that space for Certifications & Communities). However, for students who want hobbies, each hobby should optionally support a description line.

### Updated Schema

```prisma
// Replace the simple String[] hobbies with a relation
model Resume {
  // ... remove hobbies String[] ...
  hobbies     Hobby[]
}

model Hobby {
  id          String   @id @default(uuid())
  resume      Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  name        String                // "Debating"
  description String?  @db.Text    // "National-level inter-university debate participant"
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([resumeId])
}
```

### Hobby Input Component

```tsx
// components/form/HobbyInput.tsx
interface Hobby {
  id: string;
  name: string;
  description?: string;
}

export function HobbyInput({ hobbies, onChange }: { hobbies: Hobby[]; onChange: (h: Hobby[]) => void }) {
  return (
    <div className="space-y-3">
      {hobbies.map((hobby) => (
        <div key={hobby.id} className="flex gap-3 items-start border rounded-lg p-3">
          <div className="flex-1">
            <input
              value={hobby.name}
              onChange={(e) => updateHobby(hobby.id, "name", e.target.value)}
              placeholder="e.g., Competitive Debating"
              className="w-full border rounded-md px-3 py-2 text-sm font-medium"
            />
            <textarea
              value={hobby.description || ""}
              onChange={(e) => updateHobby(hobby.id, "description", e.target.value)}
              placeholder="Optional: Describe your involvement (e.g., 'National-level participant, won 3 inter-university debates')"
              rows={1}
              className="w-full border rounded-md px-3 py-1.5 text-sm mt-1 resize-none text-muted-foreground"
            />
          </div>
          <button onClick={() => removeHobby(hobby.id)}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ))}
      <button onClick={addHobby} className="text-sm text-primary flex items-center gap-1">
        <Plus className="w-4 h-4" /> Add Hobby
      </button>
    </div>
  );
}
```

### Skills Field Improvement — Category-Based Input

Your reference resume organizes skills by category. The form should support this:

```
Skills (organized by category)
┌─────────────────────────────────────────────────────────────┐
│ Category: [Languages        ▾]                              │
│ Skills:   [C] [C++] [Python] [Java] [JavaScript] [+]       │
│                                                             │
│ Category: [Frameworks & Libraries ▾]                        │
│ Skills:   [React] [Tailwind CSS] [Next.js] [Node.js] [+]   │
│                                                             │
│ Category: [AI/ML & Gen AI   ▾]                              │
│ Skills:   [Langchain] [Hugging Face] [RAG] [+]             │
│                                                             │
│ [+ Add Category]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Updated Schema for Categorized Skills

```prisma
model Resume {
  // ... remove skills String[] ...
  skillCategories  SkillCategory[]
}

model SkillCategory {
  id        String   @id @default(uuid())
  resume    Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId  String
  name      String               // "Languages", "Frameworks & Libraries", etc.
  skills    String[] @default([]) // ["C", "C++", "Python", "Java"]
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@index([resumeId])
}
```

Default categories to suggest (from your resume):
- Languages
- Frameworks & Libraries  
- AI/ML & Generative AI
- Database
- DevOps
- Soft Skills

### Achievement/Certification Improvements

Your reference resume's "Certifications & Communities" section uses bullet points with rich descriptions. The form should support this better:

```tsx
// Each achievement should have:
// - Title (required): "Runner-Up at Salesforce Crosswalk '25"
// - Description (optional, rich): "a 2-month pan-India hackathon competing among 50 shortlisted teams..."
// - Type dropdown: Competition | Certification | Hackathon | Publication | Community | Other
// - Date (optional)
// - Link (optional): for certifications with URLs
```

### Updated Achievement Schema

```prisma
model Achievement {
  id          String          @id @default(uuid())
  resume      Resume          @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeId    String
  title       String                   // "Runner-Up at Salesforce Crosswalk '25"
  description String?         @db.Text // Rich description with context
  date        DateTime?
  link        String?                  // NEW: URL for certificates
  type        AchievementType @default(OTHER)
  sortOrder   Int             @default(0)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([resumeId])
}

enum AchievementType {
  COMPETITION
  CERTIFICATION
  HACKATHON
  PUBLICATION
  COMMUNITY    // NEW: for "Core member of..."
  OTHER
}
```

---

## Reference Template: ATS-Optimized "Technical" Template

Based on your resume structure, here's the target HTML template that should be one of the options (the "Technical" template):

```html
<!-- templates/technical.hbs — Matches Harsh Singla's resume format -->
<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: A4; margin: 0.6in 0.7in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: {{fontFamily}}, 'Times New Roman', serif;
    font-size: {{fontSize}}pt;
    line-height: {{lineSpacing}};
    color: #000;
  }
  
  /* Header — Name centered, contact info below */
  .header { text-align: center; margin-bottom: 6pt; }
  .header h1 { font-size: 22pt; font-weight: bold; margin-bottom: 2pt; }
  .header .contact {
    font-size: 9.5pt;
    color: #333;
  }
  .header .contact a { color: #000; text-decoration: none; }
  .header .links { font-size: 9.5pt; }
  .header .links a { color: #1a0dab; text-decoration: none; }

  /* Section headers — bold, full-width underline */
  .section-title {
    font-size: {{headingSize}}pt;
    font-weight: bold;
    border-bottom: 1.5px solid #000;
    padding-bottom: 2pt;
    margin-top: 10pt;
    margin-bottom: 6pt;
  }

  /* Project/Experience entry */
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2pt;
  }
  .entry-title {
    font-weight: bold;
    font-size: {{fontSize}}pt;
  }
  .entry-title .subtitle { font-weight: normal; }
  .entry-link { font-size: 9pt; color: #1a0dab; text-decoration: none; }
  .entry-meta {
    font-size: 9.5pt;
    color: #555;
    font-style: italic;
  }

  /* Bullet points */
  ul { padding-left: 18pt; margin-top: 2pt; }
  ul li {
    font-size: {{fontSize}}pt;
    margin-bottom: 1.5pt;
    line-height: 1.3;
  }

  /* Skills — inline format */
  .skills-line { margin-bottom: 3pt; }
  .skills-label { font-weight: bold; }

  /* Education — right-aligned dates */
  .edu-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
  .edu-detail {
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1>{{fullName}}</h1>
    <div class="contact">
      {{city}}{{#if state}}, {{state}}{{/if}}, India
      | {{contactEmail}}
      | {{phone}}
    </div>
    <div class="links">
      {{#if linkedin}}<a href="{{linkedin}}">LinkedIn</a>{{/if}}
      {{#if github}} | <a href="{{github}}">GitHub</a>{{/if}}
      {{#if portfolio}} | <a href="{{portfolio}}">Portfolio</a>{{/if}}
    </div>
  </div>

  <!-- SECTIONS (rendered in sectionOrder) -->
  {{#each orderedSections}}
    {{#if (eq this.type "projects")}}
    <div class="section-title">Projects and Work Experience</div>
    {{#each ../projects}}
    <div class="entry-header">
      <span class="entry-title">
        {{title}}{{#if subtitle}}: <span class="subtitle">{{subtitle}}</span>{{/if}}
      </span>
      {{#if liveUrl}}<a href="{{liveUrl}}" class="entry-link">Link</a>
      {{else if repoUrl}}<a href="{{repoUrl}}" class="entry-link">Link</a>{{/if}}
    </div>
    <ul>
      {{#each bullets}}
      <li>{{this.text}}</li>
      {{/each}}
    </ul>
    {{/each}}
    {{/if}}

    {{#if (eq this.type "skills")}}
    <div class="section-title">Technology Stack and Skills</div>
    {{#each ../skillCategories}}
    <div class="skills-line">
      <span class="skills-label">{{name}}:</span>
      {{#join skills ", "}}{{/join}}
    </div>
    {{/each}}
    {{/if}}

    {{#if (eq this.type "achievements")}}
    <div class="section-title">Certifications & Communities</div>
    <ul>
      {{#each ../achievements}}
      <li>
        <strong>{{title}}</strong>{{#if description}}, {{description}}{{/if}}
      </li>
      {{/each}}
    </ul>
    {{/if}}

    {{#if (eq this.type "education")}}
    <div class="section-title">Education</div>
    <div class="edu-header">
      <span>{{../university}}</span>
      <span>{{../batchStart}} – {{../batchEnd}}</span>
    </div>
    <div class="edu-detail">
      <span>{{../stream}}{{#if ../branch}} ({{../branch}}){{/if}}</span>
      <span>CGPA: {{../cgpa}}/10.0</span>
    </div>
    {{/if}}
  {{/each}}

</body>
</html>
```

---

## Updated Complete User Flow

```
┌──────────┐    ┌─────────────────────┐    ┌───────────────────┐
│  Auth     │───▶│  Start Choice       │───▶│  Template Select  │
│  (OTP)    │    │  Upload / Scratch   │    │  5 templates      │
└──────────┘    └─────────────────────┘    └───────┬───────────┘
                                                    │
                    ┌───────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────┐
│          MULTI-STEP FORM (Split-Screen with Live Preview)   │
│   [Personal] → [Academic] → [Projects] → [Experience] →    │
│   [Skills] → [Achievements] → [Hobbies] → [Summary]        │
│                                                              │
│   Left: Form Input          Right: Live Resume Preview       │
│   Template switcher always visible in preview panel          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EDITING ROOM (IDE View)                    │
│                                                              │
│   Left: Structured Editor     Right: Live Preview            │
│   - Drag & drop sections     - Real-time render              │
│   - Bullet point editors     - Template switching            │
│   - AI buttons everywhere    - Font/style controls           │
│   - Add custom sections      - ATS score indicator           │
│   - Section visibility       - Page count indicator          │
│                                                              │
│   [🤖 Refine Full Resume]  [📊 ATS Check]  [⬇ Download PDF] │
└─────────────────────────────────────────────────────────────┘
```

---

## Updated Zustand Store Structure

```typescript
// store/resumeStore.ts — Major additions
interface ResumeState {
  // Origin
  origin: "SCRATCH" | "UPLOADED";
  
  // Template & Styles
  selectedTemplate: TemplateType;
  styles: ResumeStyles;

  // Section ordering & visibility
  sections: Section[];
  
  // Personal (unchanged)
  fullName: string; phone: string; contactEmail: string;
  city: string; state: string;
  linkedin: string; github: string; portfolio: string;

  // Academic (unchanged)
  university: string; stream: string; branch: string;
  batchStart: number; batchEnd: number; cgpa: number;
  
  // Skills (NEW: categorized)
  skillCategories: SkillCategory[];

  // Projects (NEW: with bullets)
  projects: ProjectWithBullets[];

  // Internships (NEW: with bullets)
  internships: InternshipWithBullets[];

  // Achievements (enhanced)
  achievements: EnhancedAchievement[];

  // Hobbies (NEW: with descriptions)
  hobbies: HobbyWithDescription[];

  // Custom sections
  customSections: Record<string, { title: string; items: { id: string; text: string }[] }>;

  // Summary
  summary: string;
  aiGeneratedSummary: string;

  // Actions
  setTemplate: (t: TemplateType) => void;
  setStyles: (s: Partial<ResumeStyles>) => void;
  reorderSections: (from: number, to: number) => void;
  prefillFromParsed: (data: ParsedResume) => void;
  // ... all setters
}
```

---

## New Dependencies

```json
{
  "client": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2"
  },
  "server": {
    // No new dependencies — pdftotext/pandoc are system tools already available
  }
}
```

---

## Migration Plan

### Database Migration

```bash
# 1. Create migration for all schema changes
npx prisma migrate dev --name v2_editor_improvements

# This will:
# - Add ProjectBullet, InternshipBullet models
# - Add SkillCategory model
# - Add Hobby model (replacing String[])
# - Add CustomSection, CustomSectionItem models
# - Add style fields to Resume
# - Add sectionOrder to Resume
# - Add origin and originalFileUrl to Resume
```

### Data Migration Script

```typescript
// prisma/migrations/data-migration.ts
// Migrate existing data:
// 1. Convert project.description → ProjectBullet[] (split by newlines/bullets)
// 2. Convert internship.description → InternshipBullet[]
// 3. Convert skills[] → SkillCategory[] (single "General" category)
// 4. Convert hobbies[] → Hobby[]
```

---

## Summary of All Changes

| Area | Before | After |
|------|--------|-------|
| Template selection | After form, single page | Before form + always switchable |
| Form layout | Full-width form only | Split-screen: form + live preview |
| Editing | Basic preview page | Full IDE-like editing room |
| AI support | Summary gen + ATS check | Per-bullet AI, keyword injection, full resume refinement |
| Resume upload | Not supported | Upload → AI parse → pre-fill form |
| Project descriptions | Single textarea | Structured bullet points with drag & drop |
| Skills | Flat string array | Categorized (Languages, Frameworks, etc.) |
| Hobbies | String array only | Name + optional description |
| Achievements | Basic | Enhanced with links, community type |
| Sections | Fixed order | Drag-and-drop reorder + custom sections |
| Fonts/Styles | Template-locked | User-configurable (font, size, color, spacing) |