import OpenAI from "openai";
import type { AtsResult, AiAtsAnalysis } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ResumeDataForAts {
  contactEmail?: string | null;
  phone?: string | null;
  fullName?: string | null;
  cgpa?: number | null;
  stream?: string | null;
  university?: string | null;
  skills: string[];
  summary?: string | null;
  projects: { title: string; description: string; bullets?: string[] }[];
  internships?: { role: string; company: string; bullets?: string[] }[];
  achievements?: { title: string }[];
}

// ─────────────────────────────────────────────
// ATS Check — 40 pts rule-based + 60 pts AI
// ─────────────────────────────────────────────

export const atsCheckService = async (
  data: ResumeDataForAts
): Promise<AtsResult> => {
  const result: AtsResult = {
    total: 0,
    max: 100,
    issues: [],
    suggestions: [],
  };

  // ── Rule-based checks (40 points) ────────────────────────────

  let ruleScore = 0;

  // Contact info — 10 pts
  if (data.contactEmail) {
    ruleScore += 5;
  } else {
    result.issues.push("Missing email address");
  }

  if (data.phone) {
    ruleScore += 5;
  } else {
    result.issues.push("Missing phone number");
  }

  // Name — 5 pts
  if (data.fullName) {
    ruleScore += 5;
  } else {
    result.issues.push("Missing full name");
  }

  // Summary — 5 pts
  if (data.summary && data.summary.length >= 50) {
    ruleScore += 5;
  } else {
    result.issues.push(
      data.summary
        ? "Professional summary is too short (aim for 50+ characters)"
        : "Missing professional summary"
    );
  }

  // Skills — 10 pts
  if (data.skills.length >= 6) {
    ruleScore += 10;
  } else if (data.skills.length > 0) {
    ruleScore += Math.round((data.skills.length / 6) * 10);
    result.suggestions.push(
      `Add more skills (you have ${data.skills.length}, aim for 6+)`
    );
  } else {
    result.issues.push("No skills listed");
  }

  // Projects — 5 pts
  if (data.projects.length >= 2) {
    ruleScore += 5;
  } else if (data.projects.length === 1) {
    ruleScore += 2;
    result.suggestions.push("Add at least 2 projects to strengthen your resume");
  } else {
    result.issues.push("No projects listed");
  }

  result.total += ruleScore;

  // ── AI-powered analysis (60 points) ──────────────────────────

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior technical recruiter and ATS (Applicant Tracking System) " +
            "compatibility analyser reviewing a real student resume. " +
            "Your feedback must be SPECIFIC to the actual content provided — never generic. " +
            "You must return ONLY a valid JSON object with no markdown, no explanation.",
        },
        {
          role: "user",
          content:
            "Analyse this resume's actual content for ATS compatibility and give a score from 0 to 60.\n\n" +
            "Scoring criteria:\n" +
            "- Keyword density and industry relevance (0–20 pts)\n" +
            "- Use of strong action verbs in descriptions (0–15 pts)\n" +
            "- Quantified achievements (0–15 pts)\n" +
            "- Professional language and clarity (0–10 pts)\n\n" +
            "RULES FOR issues AND suggestions — these are mandatory:\n" +
            "1. Every item MUST reference something concrete from THIS resume: name the " +
            "specific project, internship, skill, or quote the exact weak bullet/phrase you mean.\n" +
            "2. For a weak bullet, show how to fix it: rewrite it or state exactly what metric/detail to add.\n" +
            "3. Point out missing keywords that this student's field (" +
            (data.stream || "their field") +
            ") and listed projects/skills imply but that are absent.\n" +
            "4. BANNED generic phrases (do NOT output these): 'add more details', 'use action verbs', " +
            "'quantify achievements', 'add specific roles and responsibilities', 'include relevant coursework', " +
            "'consider rephrasing the summary', 'tailor to the job'. If you would write one of these, " +
            "instead name the exact bullet/section it applies to and what concretely to write.\n" +
            "5. Keep each item to one actionable sentence. Prefer 3–6 high-value items over many shallow ones.\n\n" +
            "Return exactly this JSON shape (no other text):\n" +
            '{ "score": number, "issues": string[], "suggestions": string[] }\n\n' +
            `Resume data:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      max_tokens: 700,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content ?? "{}";
    const aiResult: AiAtsAnalysis = JSON.parse(raw);

    // Clamp AI score to valid range
    const aiScore = Math.min(60, Math.max(0, aiResult.score ?? 0));
    result.total += aiScore;
    result.issues.push(...(aiResult.issues ?? []));
    result.suggestions.push(...(aiResult.suggestions ?? []));
  } catch {
    // AI portion failed — add note but keep rule-based score
    result.suggestions.push(
      "AI analysis temporarily unavailable. Score reflects structure checks only."
    );
  }

  result.total = Math.round(result.total);
  return result;
};