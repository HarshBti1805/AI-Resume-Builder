-- Add the COMPACT and ELEGANT values to the TemplateType enum.
-- These were added to schema.prisma but never migrated into the database,
-- causing "invalid input value for enum TemplateType" on those templates.
ALTER TYPE "TemplateType" ADD VALUE IF NOT EXISTS 'COMPACT';
ALTER TYPE "TemplateType" ADD VALUE IF NOT EXISTS 'ELEGANT';
