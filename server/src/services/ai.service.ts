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