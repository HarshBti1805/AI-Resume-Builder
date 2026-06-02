import type Anthropic from "@anthropic-ai/sdk";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { atsCheckService } from "./ats.service";
import { getGithubRepos } from "./github.service";

// ─────────────────────────────────────────────
// Agent tools: definitions (for Claude) + executors (against the DB).
//
// Read tools give the agent grounding context. Write tools mutate the resume —
// each calls ctx.ensureSnapshot() first so the whole turn is one undo step.
// ─────────────────────────────────────────────

export interface ToolEvent {
  tool: string;
  label: string;
  snapshotId: string | null;
}

export interface ExecContext {
  resumeId: string;
  userId: string;
  /** Lazily snapshot the resume once per turn; returns the snapshot id. */
  ensureSnapshot: (label: string) => Promise<string>;
}

export interface ToolOutcome {
  result: unknown;
  event?: ToolEvent;
  mutated?: boolean;
}

const toDate = (v?: string | null): Date | null =>
  v ? new Date(v) : null;

async function assertOwned(resumeId: string, userId: string) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true },
  });
  if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");
}

// ─────────────────────────────────────────────
// Resume context (compact, with ids the agent can reference)
// ─────────────────────────────────────────────

export async function getResumeContext(resumeId: string, userId: string) {
  const r = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      projects: {
        orderBy: { sortOrder: "asc" },
        include: { bullets: { orderBy: { sortOrder: "asc" } } },
      },
      internships: {
        orderBy: { sortOrder: "asc" },
        include: { bullets: { orderBy: { sortOrder: "asc" } } },
      },
      achievements: { orderBy: { sortOrder: "asc" } },
      skillCategories: { orderBy: { sortOrder: "asc" } },
      hobbyItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!r) throw new AppError("Resume not found", 404, "NOT_FOUND");

  return {
    personal: {
      fullName: r.fullName,
      phone: r.phone,
      contactEmail: r.contactEmail,
      city: r.city,
      state: r.state,
      linkedin: r.linkedin,
      github: r.github,
      portfolio: r.portfolio,
    },
    academic: {
      university: r.university,
      stream: r.stream,
      branch: r.branch,
      cgpa: r.cgpa,
    },
    summary: r.summary,
    skillCategories: r.skillCategories.map((c) => ({
      id: c.id,
      name: c.name,
      skills: c.skills,
    })),
    projects: r.projects.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      techStack: p.techStack,
      liveUrl: p.liveUrl,
      repoUrl: p.repoUrl,
      bullets: p.bullets.map((b) => b.text),
    })),
    internships: r.internships.map((i) => ({
      id: i.id,
      company: i.company,
      role: i.role,
      description: i.description,
      bullets: i.bullets.map((b) => b.text),
    })),
    achievements: r.achievements.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      description: a.description,
    })),
    hobbies: r.hobbyItems.map((h) => h.name),
    sectionOrder: r.sectionOrder,
    atsScore: r.atsScore,
  };
}

// ─────────────────────────────────────────────
// Tool definitions (Anthropic tool schema)
// ─────────────────────────────────────────────

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "get_resume",
    description:
      "Read the current resume content with stable ids for projects, internships, skill categories and achievements. Call this before editing so you reference the correct ids and never duplicate content.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_ats_report",
    description:
      "Run an ATS (Applicant Tracking System) analysis of the current resume. Returns a 0-100 score plus concrete issues and suggestions. Use before/after optimising for ATS.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_artifacts",
    description:
      "List context artifacts the user uploaded (resumes, certificates, notes) and pasted job descriptions. Returns ids and short excerpts.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_artifact_text",
    description:
      "Read the full extracted text of one artifact (e.g. a job description) by id.",
    input_schema: {
      type: "object",
      properties: { artifactId: { type: "string" } },
      required: ["artifactId"],
    },
  },
  {
    name: "get_github_repos",
    description:
      "Read a GitHub user's PUBLIC repositories (names, descriptions, languages, stars, README excerpts) to ground project suggestions in their real work. Only use facts present in the repos; never invent details.",
    input_schema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "GitHub username or profile URL",
        },
      },
      required: ["username"],
    },
  },
  {
    name: "update_personal",
    description:
      "Update personal/contact details. Only pass fields you intend to change.",
    input_schema: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        phone: { type: "string" },
        contactEmail: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
        portfolio: { type: "string" },
      },
    },
  },
  {
    name: "update_summary",
    description:
      "Set the professional summary. Keep it concise (about 35-50 words). Do not fabricate experience.",
    input_schema: {
      type: "object",
      properties: { summary: { type: "string" } },
      required: ["summary"],
    },
  },
  {
    name: "update_skill_categories",
    description:
      "Replace ALL skill categories with the provided list. Include every category you want to keep, since this overwrites existing categories.",
    input_schema: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
            },
            required: ["name", "skills"],
          },
        },
      },
      required: ["categories"],
    },
  },
  {
    name: "upsert_project",
    description:
      "Create a new project (omit projectId) or update an existing one (pass projectId from get_resume). Passing 'bullets' replaces that project's bullet list; omit 'bullets' to leave them unchanged.",
    input_schema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        description: { type: "string" },
        techStack: { type: "array", items: { type: "string" } },
        liveUrl: { type: "string" },
        repoUrl: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        startDate: { type: "string", description: "ISO date" },
        endDate: { type: "string", description: "ISO date" },
      },
    },
  },
  {
    name: "remove_project",
    description: "Delete a project by id.",
    input_schema: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
  },
  {
    name: "upsert_internship",
    description:
      "Create a new internship/work experience (omit internshipId) or update an existing one. Passing 'bullets' replaces that entry's bullets.",
    input_schema: {
      type: "object",
      properties: {
        internshipId: { type: "string" },
        company: { type: "string" },
        role: { type: "string" },
        description: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        startDate: { type: "string", description: "ISO date" },
        endDate: { type: "string", description: "ISO date" },
      },
    },
  },
  {
    name: "remove_internship",
    description: "Delete an internship/work experience by id.",
    input_schema: {
      type: "object",
      properties: { internshipId: { type: "string" } },
      required: ["internshipId"],
    },
  },
  {
    name: "upsert_achievement",
    description:
      "Create a new achievement (omit achievementId) or update an existing one.",
    input_schema: {
      type: "object",
      properties: {
        achievementId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        type: {
          type: "string",
          enum: [
            "COMPETITION",
            "CERTIFICATION",
            "HACKATHON",
            "PUBLICATION",
            "COMMUNITY",
            "OTHER",
          ],
        },
      },
      required: ["title"],
    },
  },
  {
    name: "reorder_sections",
    description:
      "Set the order in which resume sections render. Provide the full ordered list of section keys (e.g. summary, education, skills, experience, projects, achievements, hobbies).",
    input_schema: {
      type: "object",
      properties: {
        sectionOrder: { type: "array", items: { type: "string" } },
      },
      required: ["sectionOrder"],
    },
  },
];

// ─────────────────────────────────────────────
// Executors
// ─────────────────────────────────────────────

type Input = Record<string, unknown>;

export async function executeTool(
  name: string,
  input: Input,
  ctx: ExecContext
): Promise<ToolOutcome> {
  switch (name) {
    // ── Read tools ──────────────────────────
    case "get_resume":
      return { result: await getResumeContext(ctx.resumeId, ctx.userId) };

    case "get_ats_report": {
      const r = await prisma.resume.findFirst({
        where: { id: ctx.resumeId, userId: ctx.userId },
        include: {
          projects: { include: { bullets: true } },
          internships: { include: { bullets: true } },
          achievements: true,
        },
      });
      if (!r) throw new AppError("Resume not found", 404, "NOT_FOUND");
      const report = await atsCheckService({
        contactEmail: r.contactEmail,
        phone: r.phone,
        fullName: r.fullName,
        cgpa: r.cgpa,
        stream: r.stream,
        university: r.university,
        skills: r.skills,
        summary: r.summary,
        projects: r.projects.map((p) => ({
          title: p.title,
          description: p.description,
          bullets: p.bullets.map((b) => b.text),
        })),
        internships: r.internships.map((i) => ({
          role: i.role,
          company: i.company,
          bullets: i.bullets.map((b) => b.text),
        })),
        achievements: r.achievements.map((a) => ({ title: a.title })),
      });
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { atsScore: Math.round(report.total), lastAtsCheck: new Date() },
      });
      return { result: report };
    }

    case "list_artifacts": {
      const artifacts = await prisma.artifact.findMany({
        where: { resumeId: ctx.resumeId, userId: ctx.userId },
        orderBy: { createdAt: "desc" },
      });
      return {
        result: artifacts.map((a) => ({
          id: a.id,
          kind: a.kind,
          label: a.label,
          excerpt: a.text.slice(0, 300),
        })),
      };
    }

    case "get_artifact_text": {
      const artifact = await prisma.artifact.findFirst({
        where: {
          id: String(input.artifactId),
          resumeId: ctx.resumeId,
          userId: ctx.userId,
        },
      });
      if (!artifact)
        return { result: { error: "Artifact not found" } };
      return {
        result: {
          id: artifact.id,
          kind: artifact.kind,
          label: artifact.label,
          text: artifact.text.slice(0, 8000),
        },
      };
    }

    case "get_github_repos": {
      try {
        const data = await getGithubRepos(String(input.username));
        return { result: data };
      } catch (err) {
        return {
          result: {
            error: err instanceof Error ? err.message : "GitHub read failed",
          },
        };
      }
    }

    // ── Write tools ─────────────────────────
    case "update_personal": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const snapshotId = await ctx.ensureSnapshot("Update contact details");
      const fields = [
        "fullName",
        "phone",
        "contactEmail",
        "city",
        "state",
        "linkedin",
        "github",
        "portfolio",
      ] as const;
      const data: Record<string, unknown> = {};
      for (const f of fields) {
        if (typeof input[f] === "string") data[f] = input[f];
      }
      data.version = { increment: 1 };
      await prisma.resume.update({ where: { id: ctx.resumeId }, data });
      return {
        result: { ok: true },
        mutated: true,
        event: {
          tool: name,
          label: "Updated contact details",
          snapshotId,
        },
      };
    }

    case "update_summary": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const snapshotId = await ctx.ensureSnapshot("Update summary");
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { summary: String(input.summary), version: { increment: 1 } },
      });
      return {
        result: { ok: true },
        mutated: true,
        event: { tool: name, label: "Rewrote professional summary", snapshotId },
      };
    }

    case "update_skill_categories": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const snapshotId = await ctx.ensureSnapshot("Update skills");
      const categories = (input.categories as
        | { name: string; skills: string[] }[]
        | undefined) ?? [];
      const flat = categories.flatMap((c) => c.skills ?? []);
      await prisma.$transaction(async (tx) => {
        await tx.skillCategory.deleteMany({ where: { resumeId: ctx.resumeId } });
        if (categories.length > 0) {
          await tx.skillCategory.createMany({
            data: categories.map((c, i) => ({
              resumeId: ctx.resumeId,
              name: c.name,
              skills: c.skills ?? [],
              sortOrder: i,
            })),
          });
        }
        await tx.resume.update({
          where: { id: ctx.resumeId },
          data: { skills: flat, version: { increment: 1 } },
        });
      });
      return {
        result: { ok: true },
        mutated: true,
        event: { tool: name, label: "Updated skills", snapshotId },
      };
    }

    case "upsert_project": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const projectId = input.projectId ? String(input.projectId) : null;
      const bullets = Array.isArray(input.bullets)
        ? (input.bullets as string[])
        : null;

      if (projectId) {
        const snapshotId = await ctx.ensureSnapshot("Edit project");
        const existing = await prisma.project.findFirst({
          where: { id: projectId, resumeId: ctx.resumeId },
        });
        if (!existing) return { result: { error: "Project not found" } };
        await prisma.$transaction(async (tx) => {
          const data: Record<string, unknown> = {};
          if (typeof input.title === "string") data.title = input.title;
          if (typeof input.subtitle === "string") data.subtitle = input.subtitle;
          if (typeof input.description === "string")
            data.description = input.description;
          if (Array.isArray(input.techStack)) data.techStack = input.techStack;
          if (typeof input.liveUrl === "string") data.liveUrl = input.liveUrl;
          if (typeof input.repoUrl === "string") data.repoUrl = input.repoUrl;
          if (input.startDate) data.startDate = toDate(String(input.startDate));
          if (input.endDate) data.endDate = toDate(String(input.endDate));
          if (Object.keys(data).length > 0) {
            await tx.project.update({ where: { id: projectId }, data });
          }
          if (bullets) {
            await tx.projectBullet.deleteMany({ where: { projectId } });
            await tx.projectBullet.createMany({
              data: bullets.map((text, i) => ({
                projectId,
                text,
                sortOrder: i,
              })),
            });
          }
          await tx.resume.update({
            where: { id: ctx.resumeId },
            data: { version: { increment: 1 } },
          });
        });
        return {
          result: { ok: true, projectId },
          mutated: true,
          event: {
            tool: name,
            label: `Updated project${input.title ? `: ${input.title}` : ""}`,
            snapshotId,
          },
        };
      }

      // create
      const snapshotId = await ctx.ensureSnapshot("Add project");
      const count = await prisma.project.count({
        where: { resumeId: ctx.resumeId },
      });
      const created = await prisma.project.create({
        data: {
          resumeId: ctx.resumeId,
          title: String(input.title ?? "Untitled Project"),
          subtitle: input.subtitle ? String(input.subtitle) : null,
          description: input.description ? String(input.description) : "",
          techStack: Array.isArray(input.techStack)
            ? (input.techStack as string[])
            : [],
          liveUrl: input.liveUrl ? String(input.liveUrl) : null,
          repoUrl: input.repoUrl ? String(input.repoUrl) : null,
          startDate: toDate(input.startDate as string),
          endDate: toDate(input.endDate as string),
          sortOrder: count,
          bullets: bullets
            ? {
                create: bullets.map((text, i) => ({ text, sortOrder: i })),
              }
            : undefined,
        },
      });
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { version: { increment: 1 } },
      });
      return {
        result: { ok: true, projectId: created.id },
        mutated: true,
        event: {
          tool: name,
          label: `Added project: ${created.title}`,
          snapshotId,
        },
      };
    }

    case "remove_project": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const projectId = String(input.projectId);
      const existing = await prisma.project.findFirst({
        where: { id: projectId, resumeId: ctx.resumeId },
      });
      if (!existing) return { result: { error: "Project not found" } };
      const snapshotId = await ctx.ensureSnapshot("Remove project");
      await prisma.project.delete({ where: { id: projectId } });
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { version: { increment: 1 } },
      });
      return {
        result: { ok: true },
        mutated: true,
        event: {
          tool: name,
          label: `Removed project: ${existing.title}`,
          snapshotId,
        },
      };
    }

    case "upsert_internship": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const internshipId = input.internshipId
        ? String(input.internshipId)
        : null;
      const bullets = Array.isArray(input.bullets)
        ? (input.bullets as string[])
        : null;

      if (internshipId) {
        const snapshotId = await ctx.ensureSnapshot("Edit experience");
        const existing = await prisma.internship.findFirst({
          where: { id: internshipId, resumeId: ctx.resumeId },
        });
        if (!existing) return { result: { error: "Internship not found" } };
        await prisma.$transaction(async (tx) => {
          const data: Record<string, unknown> = {};
          if (typeof input.company === "string") data.company = input.company;
          if (typeof input.role === "string") data.role = input.role;
          if (typeof input.description === "string")
            data.description = input.description;
          if (input.startDate) data.startDate = toDate(String(input.startDate));
          if (input.endDate) data.endDate = toDate(String(input.endDate));
          if (Object.keys(data).length > 0) {
            await tx.internship.update({ where: { id: internshipId }, data });
          }
          if (bullets) {
            await tx.internshipBullet.deleteMany({ where: { internshipId } });
            await tx.internshipBullet.createMany({
              data: bullets.map((text, i) => ({
                internshipId,
                text,
                sortOrder: i,
              })),
            });
          }
          await tx.resume.update({
            where: { id: ctx.resumeId },
            data: { version: { increment: 1 } },
          });
        });
        return {
          result: { ok: true, internshipId },
          mutated: true,
          event: {
            tool: name,
            label: `Updated experience${input.role ? `: ${input.role}` : ""}`,
            snapshotId,
          },
        };
      }

      const snapshotId = await ctx.ensureSnapshot("Add experience");
      const count = await prisma.internship.count({
        where: { resumeId: ctx.resumeId },
      });
      const created = await prisma.internship.create({
        data: {
          resumeId: ctx.resumeId,
          company: String(input.company ?? ""),
          role: String(input.role ?? ""),
          description: input.description ? String(input.description) : "",
          startDate: toDate(input.startDate as string),
          endDate: toDate(input.endDate as string),
          sortOrder: count,
          bullets: bullets
            ? { create: bullets.map((text, i) => ({ text, sortOrder: i })) }
            : undefined,
        },
      });
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { version: { increment: 1 } },
      });
      return {
        result: { ok: true, internshipId: created.id },
        mutated: true,
        event: {
          tool: name,
          label: `Added experience: ${created.role} at ${created.company}`,
          snapshotId,
        },
      };
    }

    case "remove_internship": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const internshipId = String(input.internshipId);
      const existing = await prisma.internship.findFirst({
        where: { id: internshipId, resumeId: ctx.resumeId },
      });
      if (!existing) return { result: { error: "Internship not found" } };
      const snapshotId = await ctx.ensureSnapshot("Remove experience");
      await prisma.internship.delete({ where: { id: internshipId } });
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { version: { increment: 1 } },
      });
      return {
        result: { ok: true },
        mutated: true,
        event: {
          tool: name,
          label: `Removed experience: ${existing.role}`,
          snapshotId,
        },
      };
    }

    case "upsert_achievement": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const achievementId = input.achievementId
        ? String(input.achievementId)
        : null;
      const type = (input.type as string) || "OTHER";

      if (achievementId) {
        const existing = await prisma.achievement.findFirst({
          where: { id: achievementId, resumeId: ctx.resumeId },
        });
        if (!existing) return { result: { error: "Achievement not found" } };
        const snapshotId = await ctx.ensureSnapshot("Edit achievement");
        await prisma.achievement.update({
          where: { id: achievementId },
          data: {
            title: String(input.title),
            description: input.description ? String(input.description) : null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: type as any,
          },
        });
        await prisma.resume.update({
          where: { id: ctx.resumeId },
          data: { version: { increment: 1 } },
        });
        return {
          result: { ok: true, achievementId },
          mutated: true,
          event: {
            tool: name,
            label: `Updated achievement: ${input.title}`,
            snapshotId,
          },
        };
      }

      const snapshotId = await ctx.ensureSnapshot("Add achievement");
      const count = await prisma.achievement.count({
        where: { resumeId: ctx.resumeId },
      });
      const created = await prisma.achievement.create({
        data: {
          resumeId: ctx.resumeId,
          title: String(input.title),
          description: input.description ? String(input.description) : null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: type as any,
          sortOrder: count,
        },
      });
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { version: { increment: 1 } },
      });
      return {
        result: { ok: true, achievementId: created.id },
        mutated: true,
        event: {
          tool: name,
          label: `Added achievement: ${created.title}`,
          snapshotId,
        },
      };
    }

    case "reorder_sections": {
      await assertOwned(ctx.resumeId, ctx.userId);
      const sectionOrder = Array.isArray(input.sectionOrder)
        ? (input.sectionOrder as string[])
        : [];
      const snapshotId = await ctx.ensureSnapshot("Reorder sections");
      await prisma.resume.update({
        where: { id: ctx.resumeId },
        data: { sectionOrder },
      });
      return {
        result: { ok: true },
        mutated: true,
        event: { tool: name, label: "Reordered sections", snapshotId },
      };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}
