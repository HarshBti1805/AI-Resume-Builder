-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "schoolName10th" TEXT,
ADD COLUMN     "schoolName12th" TEXT,
ADD COLUMN     "showCoursework" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showMarks10th" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showMarks12th" BOOLEAN NOT NULL DEFAULT true;
