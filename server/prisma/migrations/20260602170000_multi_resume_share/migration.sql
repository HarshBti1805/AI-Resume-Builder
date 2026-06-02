-- Multiple resumes / versions + shareable public link.
-- All columns are additive and nullable/defaulted, so this is non-destructive
-- for existing rows.

ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "title" TEXT DEFAULT 'Untitled Resume';
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "shareId" TEXT;
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Unique index for the public share slug.
CREATE UNIQUE INDEX IF NOT EXISTS "Resume_shareId_key" ON "Resume"("shareId");
