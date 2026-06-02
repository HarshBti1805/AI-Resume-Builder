-- Add explicit "save to library" flag so auto-saved drafts don't clutter the profile.
ALTER TABLE "Resume" ADD COLUMN "savedToLibrary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resume" ADD COLUMN "savedAt" TIMESTAMP(3);
