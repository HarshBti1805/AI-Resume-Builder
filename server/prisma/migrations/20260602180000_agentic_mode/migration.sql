-- Agentic mode: full-resume snapshots (rollback), persisted chat, and uploaded artifacts.
-- All additive; safe for existing rows.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ArtifactKind" AS ENUM ('FILE', 'JD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: ResumeSnapshot
CREATE TABLE IF NOT EXISTS "ResumeSnapshot" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT,
    "source" TEXT NOT NULL DEFAULT 'agent',
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ResumeSnapshot_resumeId_idx" ON "ResumeSnapshot"("resumeId");
CREATE INDEX IF NOT EXISTS "ResumeSnapshot_resumeId_createdAt_idx" ON "ResumeSnapshot"("resumeId", "createdAt");

-- CreateTable: AgentMessage
CREATE TABLE IF NOT EXISTS "AgentMessage" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolEvents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgentMessage_resumeId_createdAt_idx" ON "AgentMessage"("resumeId", "createdAt");

-- CreateTable: Artifact
CREATE TABLE IF NOT EXISTS "Artifact" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ArtifactKind" NOT NULL DEFAULT 'FILE',
    "label" TEXT,
    "mimeType" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Artifact_resumeId_createdAt_idx" ON "Artifact"("resumeId", "createdAt");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "ResumeSnapshot" ADD CONSTRAINT "ResumeSnapshot_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
