-- CreateEnum
CREATE TYPE "ResumeOrigin" AS ENUM ('SCRATCH', 'UPLOADED');

-- AlterEnum
ALTER TYPE "AchievementType" ADD VALUE 'COMMUNITY';

-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "subtitle" TEXT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "accentColor" TEXT DEFAULT '#000000',
ADD COLUMN     "fontFamily" TEXT DEFAULT 'Georgia',
ADD COLUMN     "fontSize" INTEGER DEFAULT 11,
ADD COLUMN     "headingSize" INTEGER DEFAULT 14,
ADD COLUMN     "lineSpacing" DOUBLE PRECISION DEFAULT 1.15,
ADD COLUMN     "marginSize" TEXT DEFAULT 'normal',
ADD COLUMN     "origin" "ResumeOrigin" NOT NULL DEFAULT 'SCRATCH',
ADD COLUMN     "originalFileUrl" TEXT,
ADD COLUMN     "sectionDivider" TEXT DEFAULT 'line',
ADD COLUMN     "sectionOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ProjectBullet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBullet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipBullet" (
    "id" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipBullet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hobby" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSection" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBullet_projectId_idx" ON "ProjectBullet"("projectId");

-- CreateIndex
CREATE INDEX "InternshipBullet_internshipId_idx" ON "InternshipBullet"("internshipId");

-- CreateIndex
CREATE INDEX "SkillCategory_resumeId_idx" ON "SkillCategory"("resumeId");

-- CreateIndex
CREATE INDEX "Hobby_resumeId_idx" ON "Hobby"("resumeId");

-- CreateIndex
CREATE INDEX "CustomSection_resumeId_idx" ON "CustomSection"("resumeId");

-- CreateIndex
CREATE INDEX "CustomSectionItem_sectionId_idx" ON "CustomSectionItem"("sectionId");

-- AddForeignKey
ALTER TABLE "ProjectBullet" ADD CONSTRAINT "ProjectBullet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipBullet" ADD CONSTRAINT "InternshipBullet_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCategory" ADD CONSTRAINT "SkillCategory_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hobby" ADD CONSTRAINT "Hobby_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomSection" ADD CONSTRAINT "CustomSection_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomSectionItem" ADD CONSTRAINT "CustomSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CustomSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
