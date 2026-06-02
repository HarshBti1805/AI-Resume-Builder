import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// Resume snapshots — power undo / rollback for the agentic editor.
//
// A snapshot is a full serialized copy of a resume (scalars + every relation),
// taken BEFORE an agent action mutates the resume. Restoring a snapshot wipes
// the live relations and recreates them from the stored JSON.
// ─────────────────────────────────────────────

const RESUME_INCLUDE = {
  projects: {
    orderBy: { sortOrder: "asc" as const },
    include: { bullets: { orderBy: { sortOrder: "asc" as const } } },
  },
  internships: {
    orderBy: { sortOrder: "asc" as const },
    include: { bullets: { orderBy: { sortOrder: "asc" as const } } },
  },
  achievements: { orderBy: { sortOrder: "asc" as const } },
  skillCategories: { orderBy: { sortOrder: "asc" as const } },
  hobbyItems: { orderBy: { sortOrder: "asc" as const } },
  customSections: {
    orderBy: { sortOrder: "asc" as const },
    include: { items: { orderBy: { sortOrder: "asc" as const } } },
  },
} satisfies Prisma.ResumeInclude;

export type SerializedResume = Prisma.ResumeGetPayload<{
  include: typeof RESUME_INCLUDE;
}>;

/**
 * Fetch a full resume (scalars + all relations) for the owner.
 */
export async function serializeResume(
  resumeId: string,
  userId: string
): Promise<SerializedResume> {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: RESUME_INCLUDE,
  });
  if (!resume) throw new AppError("Resume not found", 404, "NOT_FOUND");
  return resume;
}

/**
 * Capture a snapshot of the resume's current state. Returns the snapshot id so
 * the caller can attach it to a chat tool-event for one-click undo.
 */
export async function createSnapshot(
  resumeId: string,
  userId: string,
  label: string,
  source: "agent" | "manual" = "agent"
): Promise<{ id: string; version: number }> {
  const data = await serializeResume(resumeId, userId);
  const snapshot = await prisma.resumeSnapshot.create({
    data: {
      resumeId,
      userId,
      version: data.version,
      label,
      source,
      data: data as unknown as Prisma.InputJsonValue,
    },
  });
  return { id: snapshot.id, version: data.version };
}

/**
 * List snapshots (metadata only — not the heavy JSON payload), newest first.
 */
export async function listSnapshots(resumeId: string, userId: string) {
  return prisma.resumeSnapshot.findMany({
    where: { resumeId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      version: true,
      label: true,
      source: true,
      createdAt: true,
    },
  });
}

const toDate = (v: unknown): Date | null =>
  v ? new Date(v as string) : null;

/**
 * Overwrite a resume's relations + scalar content from a serialized snapshot.
 * Runs inside the given transaction client.
 */
async function applyResumeData(
  tx: Prisma.TransactionClient,
  resumeId: string,
  data: SerializedResume
): Promise<void> {
  // 1) Scalars
  await tx.resume.update({
    where: { id: resumeId },
    data: {
      status: data.status,
      currentStep: data.currentStep,
      selectedTemplate: data.selectedTemplate,
      fullName: data.fullName,
      dateOfBirth: toDate(data.dateOfBirth),
      phone: data.phone,
      contactEmail: data.contactEmail,
      city: data.city,
      state: data.state,
      linkedin: data.linkedin,
      github: data.github,
      portfolio: data.portfolio,
      photoUrl: data.photoUrl,
      university: data.university,
      stream: data.stream,
      branch: data.branch,
      batchStart: data.batchStart,
      batchEnd: data.batchEnd,
      cgpa: data.cgpa,
      marks10th: data.marks10th,
      marks12th: data.marks12th,
      board10th: data.board10th,
      board12th: data.board12th,
      schoolName10th: data.schoolName10th,
      schoolName12th: data.schoolName12th,
      coursework: data.coursework,
      showCoursework: data.showCoursework,
      showMarks10th: data.showMarks10th,
      showMarks12th: data.showMarks12th,
      skills: data.skills,
      hobbies: data.hobbies,
      summary: data.summary,
      aiGeneratedSummary: data.aiGeneratedSummary,
      sectionOrder: data.sectionOrder,
      sectionTitles:
        (data.sectionTitles as Prisma.InputJsonValue) ?? undefined,
      fontFamily: data.fontFamily,
      fontSize: data.fontSize,
      headingSize: data.headingSize,
      accentColor: data.accentColor,
      lineSpacing: data.lineSpacing,
      marginSize: data.marginSize,
      sectionDivider: data.sectionDivider,
      version: { increment: 1 },
    },
  });

  // 2) Wipe + rebuild relations
  await tx.projectBullet.deleteMany({ where: { project: { resumeId } } });
  await tx.project.deleteMany({ where: { resumeId } });
  await tx.internshipBullet.deleteMany({
    where: { internship: { resumeId } },
  });
  await tx.internship.deleteMany({ where: { resumeId } });
  await tx.achievement.deleteMany({ where: { resumeId } });
  await tx.skillCategory.deleteMany({ where: { resumeId } });
  await tx.hobby.deleteMany({ where: { resumeId } });
  await tx.customSectionItem.deleteMany({
    where: { section: { resumeId } },
  });
  await tx.customSection.deleteMany({ where: { resumeId } });

  for (const p of data.projects) {
    await tx.project.create({
      data: {
        resumeId,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        techStack: p.techStack,
        liveUrl: p.liveUrl,
        repoUrl: p.repoUrl,
        startDate: toDate(p.startDate),
        endDate: toDate(p.endDate),
        sortOrder: p.sortOrder,
        bullets: {
          create: p.bullets.map((b) => ({
            text: b.text,
            sortOrder: b.sortOrder,
          })),
        },
      },
    });
  }

  for (const i of data.internships) {
    await tx.internship.create({
      data: {
        resumeId,
        company: i.company,
        role: i.role,
        description: i.description,
        startDate: toDate(i.startDate),
        endDate: toDate(i.endDate),
        sortOrder: i.sortOrder,
        bullets: {
          create: i.bullets.map((b) => ({
            text: b.text,
            sortOrder: b.sortOrder,
          })),
        },
      },
    });
  }

  if (data.achievements.length > 0) {
    await tx.achievement.createMany({
      data: data.achievements.map((a) => ({
        resumeId,
        title: a.title,
        description: a.description,
        date: toDate(a.date),
        link: a.link,
        type: a.type,
        sortOrder: a.sortOrder,
      })),
    });
  }

  if (data.skillCategories.length > 0) {
    await tx.skillCategory.createMany({
      data: data.skillCategories.map((c) => ({
        resumeId,
        name: c.name,
        skills: c.skills,
        sortOrder: c.sortOrder,
      })),
    });
  }

  if (data.hobbyItems.length > 0) {
    await tx.hobby.createMany({
      data: data.hobbyItems.map((h) => ({
        resumeId,
        name: h.name,
        description: h.description,
        sortOrder: h.sortOrder,
      })),
    });
  }

  for (const cs of data.customSections) {
    await tx.customSection.create({
      data: {
        resumeId,
        title: cs.title,
        sortOrder: cs.sortOrder,
        items: {
          create: cs.items.map((it) => ({
            text: it.text,
            sortOrder: it.sortOrder,
          })),
        },
      },
    });
  }
}

/**
 * Restore a specific snapshot. Returns the resume id that was restored.
 */
export async function restoreSnapshot(
  snapshotId: string,
  userId: string
): Promise<{ resumeId: string }> {
  const snapshot = await prisma.resumeSnapshot.findFirst({
    where: { id: snapshotId, userId },
  });
  if (!snapshot) throw new AppError("Snapshot not found", 404, "NOT_FOUND");

  const data = snapshot.data as unknown as SerializedResume;

  await prisma.$transaction(async (tx) => {
    await applyResumeData(tx, snapshot.resumeId, data);
  });

  return { resumeId: snapshot.resumeId };
}

/**
 * Undo the most recent change: restore the newest snapshot and pop it off the
 * stack so repeated undos walk further back in history.
 */
export async function undoLast(
  resumeId: string,
  userId: string
): Promise<{ resumeId: string; label: string | null } | null> {
  const latest = await prisma.resumeSnapshot.findFirst({
    where: { resumeId, userId },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return null;

  const data = latest.data as unknown as SerializedResume;

  await prisma.$transaction(async (tx) => {
    await applyResumeData(tx, resumeId, data);
    await tx.resumeSnapshot.delete({ where: { id: latest.id } });
  });

  return { resumeId, label: latest.label };
}
