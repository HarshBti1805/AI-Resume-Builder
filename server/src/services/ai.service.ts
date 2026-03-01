import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ResumeDataForAI {
  stream: string;
  university: string;
  skills: string[];
  projects: { title: string }[];
  internships: { role: string; company: string }[];
}

// ─────────────────────────────────────────────
// Generate professional summary
// ─────────────────────────────────────────────

export const generateSummaryService = async (
  data: ResumeDataForAI
): Promise<string> => {
  const projectList = data.projects.map((p) => p.title).join(", ") || "none";
  const expList =
    data.internships.map((i) => `${i.role} at ${i.company}`).join(", ") ||
    "none";
  const skillList = data.skills.join(", ") || "none";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume writer specialising in university students. " +
          "Write concise, impactful professional summaries. " +
          "Never use generic filler phrases like 'hard-working', 'passionate', or 'team player'. " +
          "Be specific. Use first person. 2–3 sentences max.",
      },
      {
        role: "user",
        content:
          `Write a professional summary for a ${data.stream} student at ${data.university}.\n` +
          `Skills: ${skillList}\n` +
          `Projects: ${projectList}\n` +
          `Experience: ${expList}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0].message.content?.trim() ?? "";
};

// ─────────────────────────────────────────────
// Enhance a single bullet point / description
// ─────────────────────────────────────────────

export const enhanceBulletService = async (
  rawText: string,
  context: string
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Rewrite the resume bullet point to be more impactful. " +
          "Rules: start with a strong action verb (Built, Designed, Reduced, Improved, Implemented, etc.), " +
          "quantify results where the original implies them, keep to 1–2 sentences, " +
          "do NOT fabricate numbers that aren't implied by the original text. " +
          "Return ONLY the improved text — no preamble, no quotes.",
      },
      {
        role: "user",
        content: `Context: ${context || "resume bullet point"}\nOriginal: ${rawText}`,
      },
    ],
    max_tokens: 150,
    temperature: 0.6,
  });

  return response.choices[0].message.content?.trim() ?? rawText;
};

// ─────────────────────────────────────────────
// Improve bullet with action verbs and quantification
// ─────────────────────────────────────────────

export const improveBulletService = async (
  bullet: string,
  context: string
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume editor. Improve this resume bullet point. " +
          "Start with a strong action verb. Add quantification where plausible. " +
          "Keep it concise (1-2 lines). Do NOT fabricate specific numbers. " +
          "Return ONLY the improved text.",
      },
      {
        role: "user",
        content: `Section context: ${context}\nBullet: ${bullet}`,
      },
    ],
    max_tokens: 150,
    temperature: 0.6,
  });

  return response.choices[0].message.content?.trim() ?? bullet;
};

// ─────────────────────────────────────────────
// Add ATS keywords to a bullet
// ─────────────────────────────────────────────

interface AddKeywordsResult {
  improved: string;
  addedKeywords: string[];
}

export const addKeywordsService = async (
  bullet: string,
  context: string
): Promise<AddKeywordsResult> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an ATS optimisation expert. Inject relevant industry-standard keywords " +
          "into this resume bullet point to improve ATS score. Keep the meaning and action verbs. " +
          "Return a JSON object with two fields: " +
          '"improved" (the enhanced text) and "addedKeywords" (array of keywords you added). ' +
          "Return ONLY valid JSON, no markdown.",
      },
      {
        role: "user",
        content: `Section context: ${context}\nBullet: ${bullet}`,
      },
    ],
    max_tokens: 250,
    temperature: 0.5,
  });

  const raw = response.choices[0].message.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw) as AddKeywordsResult;
    return parsed;
  } catch {
    return { improved: raw || bullet, addedKeywords: [] };
  }
};

// ─────────────────────────────────────────────
// Generate structured bullets from a description
// ─────────────────────────────────────────────

export const generateBulletsService = async (
  description: string,
  techStack: string[],
  count: number = 4
): Promise<string[]> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          `Generate exactly ${count} resume bullet points from the project/experience description. ` +
          "Each bullet should start with a strong action verb and be 1-2 sentences. " +
          "Incorporate the tech stack where relevant. " +
          "Return a JSON array of strings. No markdown, just the JSON array.",
      },
      {
        role: "user",
        content:
          `Description: ${description}\n` +
          `Tech stack: ${techStack.join(", ") || "not specified"}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content?.trim() ?? "[]";
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────
// Refine full resume — suggestions + score
// ─────────────────────────────────────────────

interface RefineResult {
  score: number;
  suggestions: string[];
  missingKeywords: string[];
}

export const refineFullResumeService = async (
  resumeData: ResumeDataForAI & {
    summary?: string;
    achievements?: { title: string }[];
  }
): Promise<RefineResult> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert resume reviewer. Analyse the provided resume data and return a JSON object with: " +
          '"score" (0-100 ATS score), "suggestions" (array of 3-5 actionable improvement tips), ' +
          '"missingKeywords" (array of commonly expected keywords for this profile that are missing). ' +
          "Return ONLY valid JSON, no markdown.",
      },
      {
        role: "user",
        content: JSON.stringify(resumeData),
      },
    ],
    max_tokens: 600,
    temperature: 0.5,
  });

  const raw = response.choices[0].message.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw) as RefineResult;
    return parsed;
  } catch {
    return { score: 0, suggestions: [], missingKeywords: [] };
  }
};