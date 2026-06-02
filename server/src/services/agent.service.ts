import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import logger from "../utils/logger";
import { createSnapshot } from "./snapshot.service";
import {
  toolDefinitions,
  executeTool,
  getResumeContext,
  type ToolEvent,
  type ExecContext,
} from "./agent.tools";

// ─────────────────────────────────────────────
// Agentic resume editor (Anthropic Claude + tool use).
//
// Runs an autonomous loop: the model reads context and calls tools that mutate
// the resume directly. The first mutating tool of a turn snapshots the resume
// so the whole turn is a single undo step.
// ─────────────────────────────────────────────

const MAX_ITERATIONS = 10;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured on the server. Agentic mode is unavailable."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are the autonomous AI editor inside an online resume builder for university students.

You operate in AGENTIC MODE: when the user asks for something, you directly edit their resume by calling tools. You do NOT ask for permission before editing — the user has a one-click Undo for every change, so act decisively. The live resume preview updates automatically after your edits.

WORKFLOW
- Call get_resume FIRST whenever you might edit, so you use the correct ids and never duplicate existing content.
- Make the edits with the write tools (update_summary, upsert_project, upsert_internship, update_skill_categories, upsert_achievement, update_personal, reorder_sections, etc.).
- After editing, reply with a short, friendly summary of exactly what you changed (1-3 sentences). Do not paste the whole resume back.

TASK PATTERNS
- "Tailor my resume to this job description": read the JD with list_artifacts + get_artifact_text, run get_ats_report, then rewrite the summary, reorder/emphasise relevant projects and experience, and align skills + bullet keywords to the JD — using ONLY skills and experience the candidate genuinely has.
- "Improve my ATS score": run get_ats_report, then apply concrete fixes — strong action verbs, quantification where the original already implies a number, and missing industry keywords the candidate's real background supports. Re-run get_ats_report if helpful.
- "Add my GitHub projects": use get_github_repos for the given username and create projects from REAL repos (name, description, languages as tech stack, README facts). Never invent functionality not present in the repo.

HARD RULES (do not violate)
- NEVER fabricate facts: no invented metrics, numbers, percentages, employers, dates, certifications, or technologies the user does not actually have.
- If a request needs information you do not have (e.g. a metric, a company name, dates, the GitHub username), DO NOT guess. Either make the safe edits you can and clearly state what you skipped, or ask the user a brief, specific question. Offering a concrete suggestion the user can confirm is fine.
- Keep the student's voice. Prefer concise, impactful, ATS-friendly phrasing.
- When unsure whether an edit is wanted, prefer a smaller, reversible change and explain it.`;

export interface ToolEventEmit extends ToolEvent {
  status?: "running" | "done";
}

export interface RunAgentParams {
  resumeId: string;
  userId: string;
  /** Short label (the user's message) used for the turn's snapshot. */
  turnLabel: string;
  /** Full prior conversation as Anthropic message params. */
  messages: Anthropic.MessageParam[];
  onText: (delta: string) => void;
  onToolEvent: (event: ToolEventEmit) => void;
}

export interface RunAgentResult {
  text: string;
  toolEvents: ToolEvent[];
  mutated: boolean;
}

export async function runAgent(
  params: RunAgentParams
): Promise<RunAgentResult> {
  const { resumeId, userId, turnLabel, onText, onToolEvent } = params;
  const anthropic = getClient();

  // Seed the conversation with a fresh snapshot of the current resume so the
  // model has grounding even before it calls get_resume.
  let initialContext = "";
  try {
    const ctx = await getResumeContext(resumeId, userId);
    initialContext = `\n\nCurrent resume snapshot (for grounding):\n${JSON.stringify(
      ctx
    )}`;
  } catch {
    // ignore — get_resume tool is still available
  }

  const messages: Anthropic.MessageParam[] = [...params.messages];

  // Lazy, once-per-turn snapshot shared by every write tool.
  let snapshotId: string | null = null;
  const ensureSnapshot = async (fallbackLabel: string): Promise<string> => {
    if (!snapshotId) {
      const label = turnLabel?.trim()
        ? turnLabel.trim().slice(0, 120)
        : fallbackLabel;
      const snap = await createSnapshot(resumeId, userId, label, "agent");
      snapshotId = snap.id;
    }
    return snapshotId;
  };

  const execCtx: ExecContext = { resumeId, userId, ensureSnapshot };

  const collectedEvents: ToolEvent[] = [];
  let fullText = "";
  let mutated = false;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const stream = anthropic.messages.stream({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 2048,
      system:
        iteration === 0 ? SYSTEM_PROMPT + initialContext : SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    stream.on("text", (delta: string) => {
      fullText += delta;
      onText(delta);
    });

    const final = await stream.finalMessage();
    messages.push({ role: "assistant", content: final.content });

    const toolUses = final.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (final.stop_reason !== "tool_use" || toolUses.length === 0) {
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      onToolEvent({
        tool: tu.name,
        label: humanizeToolStart(tu.name),
        snapshotId: null,
        status: "running",
      });

      let outcome;
      try {
        outcome = await executeTool(
          tu.name,
          (tu.input ?? {}) as Record<string, unknown>,
          execCtx
        );
      } catch (err) {
        logger.error("Agent tool failed", { tool: tu.name, err });
        outcome = {
          result: {
            error: err instanceof Error ? err.message : "Tool execution failed",
          },
        };
      }

      const doneEvent: ToolEvent = outcome.event ?? {
        tool: tu.name,
        label: humanizeToolDone(tu.name),
        snapshotId: null,
      };
      if (outcome.event) collectedEvents.push(outcome.event);
      onToolEvent({ ...doneEvent, status: "done" });
      if (outcome.mutated) mutated = true;

      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(outcome.result),
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return { text: fullText.trim(), toolEvents: collectedEvents, mutated };
}

function humanizeToolStart(tool: string): string {
  const map: Record<string, string> = {
    get_resume: "Reading your resume",
    get_ats_report: "Analysing ATS score",
    list_artifacts: "Reviewing your uploads",
    get_artifact_text: "Reading attached document",
    get_github_repos: "Reading your GitHub projects",
    update_personal: "Updating contact details",
    update_summary: "Rewriting summary",
    update_skill_categories: "Updating skills",
    upsert_project: "Editing a project",
    remove_project: "Removing a project",
    upsert_internship: "Editing experience",
    remove_internship: "Removing experience",
    upsert_achievement: "Editing an achievement",
    reorder_sections: "Reordering sections",
  };
  return map[tool] ?? tool;
}

function humanizeToolDone(tool: string): string {
  const map: Record<string, string> = {
    get_resume: "Read your resume",
    get_ats_report: "Analysed ATS score",
    list_artifacts: "Reviewed your uploads",
    get_artifact_text: "Read attached document",
    get_github_repos: "Read your GitHub projects",
  };
  return map[tool] ?? humanizeToolStart(tool);
}
