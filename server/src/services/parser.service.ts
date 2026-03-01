import OpenAI from "openai";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedResume {
  fullName?: string;
  phone?: string;
  contactEmail?: string;
  city?: string;
  state?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  university?: string;
  stream?: string;
  branch?: string;
  batchStart?: number;
  batchEnd?: number;
  cgpa?: number;
  summary?: string;
  skillCategories: { name: string; skills: string[] }[];
  projects: {
    title: string;
    bullets: string[];
    techStack: string[];
  }[];
  internships: {
    company: string;
    role: string;
    bullets: string[];
    startDate?: string;
    endDate?: string;
  }[];
  achievements: {
    title: string;
    description?: string;
    link?: string;
    type?: string;
  }[];
  hobbyItems: { name: string; description?: string }[];
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const tmpFile = path.join(
    os.tmpdir(),
    `resume-${crypto.randomBytes(6).toString("hex")}.pdf`
  );
  try {
    await writeFile(tmpFile, buffer);
    const { stdout } = await execAsync(
      `pdftotext -layout "${tmpFile}" -`
    );
    return stdout;
  } catch {
    // Fallback: try without pdftotext (may not be installed)
    return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const tmpFile = path.join(
    os.tmpdir(),
    `resume-${crypto.randomBytes(6).toString("hex")}.docx`
  );
  try {
    await writeFile(tmpFile, buffer);
    const { stdout } = await execAsync(
      `pandoc "${tmpFile}" -t plain --wrap=none`
    );
    return stdout;
  } catch {
    return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

export async function extractText(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (mimetype === "application/pdf") {
    return extractTextFromPdf(buffer);
  }
  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    return extractTextFromDocx(buffer);
  }
  return buffer.toString("utf-8");
}

export async function parseResumeText(
  text: string
): Promise<ParsedResume> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a resume parser. Extract structured data from the resume text. " +
          "Return a JSON object matching this schema exactly:\n" +
          "{\n" +
          '  "fullName": string | null,\n' +
          '  "phone": string | null,\n' +
          '  "contactEmail": string | null,\n' +
          '  "city": string | null,\n' +
          '  "state": string | null,\n' +
          '  "linkedin": string | null,\n' +
          '  "github": string | null,\n' +
          '  "portfolio": string | null,\n' +
          '  "university": string | null,\n' +
          '  "stream": string | null,\n' +
          '  "branch": string | null,\n' +
          '  "batchStart": number | null,\n' +
          '  "batchEnd": number | null,\n' +
          '  "cgpa": number | null,\n' +
          '  "summary": string | null,\n' +
          '  "skillCategories": [{ "name": string, "skills": string[] }],\n' +
          '  "projects": [{ "title": string, "bullets": string[], "techStack": string[] }],\n' +
          '  "internships": [{ "company": string, "role": string, "bullets": string[], "startDate": string | null, "endDate": string | null }],\n' +
          '  "achievements": [{ "title": string, "description": string | null, "link": string | null, "type": "COMPETITION" | "CERTIFICATION" | "HACKATHON" | "PUBLICATION" | "COMMUNITY" | "OTHER" }],\n' +
          '  "hobbyItems": [{ "name": string, "description": string | null }]\n' +
          "}\n" +
          "Return ONLY valid JSON. No markdown, no explanation.",
      },
      {
        role: "user",
        content: text.slice(0, 8000),
      },
    ],
    max_tokens: 3000,
    temperature: 0.2,
  });

  const raw = response.choices[0].message.content?.trim() ?? "{}";
  try {
    const parsed = JSON.parse(raw) as ParsedResume;
    return {
      ...parsed,
      skillCategories: parsed.skillCategories ?? [],
      projects: parsed.projects ?? [],
      internships: parsed.internships ?? [],
      achievements: parsed.achievements ?? [],
      hobbyItems: parsed.hobbyItems ?? [],
    };
  } catch {
    return {
      skillCategories: [],
      projects: [],
      internships: [],
      achievements: [],
      hobbyItems: [],
    };
  }
}
