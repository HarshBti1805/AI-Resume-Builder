/**
 * Data migration: converts legacy flat fields to the new relational models.
 *
 * - Project.description  -> ProjectBullet rows (split by newline / bullet chars)
 * - Internship.description -> InternshipBullet rows
 * - Resume.skills[]       -> single SkillCategory "General"
 * - Resume.hobbies[]      -> Hobby rows (name only)
 *
 * Run with: npx tsx prisma/data-migration.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function splitIntoBullets(text: string): string[] {
  if (!text || !text.trim()) return [];

  return text
    .split(/\n|(?:^|\n)\s*[•\-\*]\s*/m)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function main() {
  console.log("Starting data migration...");

  const projects = await prisma.project.findMany({
    include: { bullets: true },
  });

  let projCount = 0;
  for (const project of projects) {
    if (project.bullets.length > 0) continue;
    const bullets = splitIntoBullets(project.description);
    if (bullets.length === 0) continue;

    await prisma.projectBullet.createMany({
      data: bullets.map((text, i) => ({
        projectId: project.id,
        text,
        sortOrder: i,
      })),
    });
    projCount += bullets.length;
  }
  console.log(`  Migrated ${projCount} project bullets`);

  const internships = await prisma.internship.findMany({
    include: { bullets: true },
  });

  let internCount = 0;
  for (const internship of internships) {
    if (internship.bullets.length > 0) continue;
    const bullets = splitIntoBullets(internship.description);
    if (bullets.length === 0) continue;

    await prisma.internshipBullet.createMany({
      data: bullets.map((text, i) => ({
        internshipId: internship.id,
        text,
        sortOrder: i,
      })),
    });
    internCount += bullets.length;
  }
  console.log(`  Migrated ${internCount} internship bullets`);

  const resumes = await prisma.resume.findMany({
    include: { skillCategories: true, hobbyItems: true },
  });

  let skillCount = 0;
  let hobbyCount = 0;

  for (const resume of resumes) {
    if (resume.skillCategories.length === 0 && resume.skills.length > 0) {
      await prisma.skillCategory.create({
        data: {
          resumeId: resume.id,
          name: "General",
          skills: resume.skills,
          sortOrder: 0,
        },
      });
      skillCount++;
    }

    if (resume.hobbyItems.length === 0 && resume.hobbies.length > 0) {
      await prisma.hobby.createMany({
        data: resume.hobbies.map((name, i) => ({
          resumeId: resume.id,
          name,
          sortOrder: i,
        })),
      });
      hobbyCount += resume.hobbies.length;
    }
  }

  console.log(`  Migrated ${skillCount} resume skill categories`);
  console.log(`  Migrated ${hobbyCount} hobby items`);
  console.log("Data migration complete.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
