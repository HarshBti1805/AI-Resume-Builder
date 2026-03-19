"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useResumeStore } from "@/store/resumeStore";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AcademicPage() {
  const { step2, updateStep2 } = useResumeStore();
  const [courseInput, setCourseInput] = useState("");

  const update = (field: keyof typeof step2, value: unknown) => {
    updateStep2({ [field]: value } as any);
  };

  const addCourse = () => {
    const trimmed = courseInput.trim();
    if (trimmed && !step2.coursework.includes(trimmed)) {
      update("coursework", [...step2.coursework, trimmed]);
      setCourseInput("");
    }
  };

  const removeCourse = (course: string) => {
    update("coursework", step2.coursework.filter((c) => c !== course));
  };

  const handleCourseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCourse();
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
          Step 2 of 5
        </p>
        <h1 className="font-instrument-serif mt-1 text-2xl tracking-wide text-foreground sm:text-3xl">
          Academic details
        </h1>
        <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
          Your education background. This is typically the first section
          recruiters look at for freshers and students.
        </p>
      </motion.div>

      <form className="flex flex-col gap-8">
        {/* ─── University ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            University
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                University <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={step2.university}
                onChange={(e) => update("university", e.target.value)}
                placeholder="Chitkara University"
                required
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stream <span className="text-red-400">*</span>
              </label>
              <select
                value={step2.stream}
                onChange={(e) => update("stream", e.target.value)}
                required
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select stream</option>
                <option value="B.E.">B.E.</option>
                <option value="B.Tech">B.Tech</option>
                <option value="BCA">BCA</option>
                <option value="BBA">BBA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MBA">MBA</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Branch <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={step2.branch}
                onChange={(e) => update("branch", e.target.value)}
                placeholder="Computer Science & Engineering"
                required
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── Batch & CGPA ─── */}
        <motion.div variants={item}>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Batch start
              </label>
              <input
                type="number"
                value={step2.batchStart}
                onChange={(e) => update("batchStart", e.target.value)}
                placeholder="2023"
                min="2000"
                max="2035"
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Batch end
              </label>
              <input
                type="number"
                value={step2.batchEnd}
                onChange={(e) => update("batchEnd", e.target.value)}
                placeholder="2027"
                min="2000"
                max="2035"
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                CGPA <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={step2.cgpa}
                onChange={(e) => update("cgpa", e.target.value)}
                placeholder="8.5"
                min="0"
                max="10"
                required
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── 12th ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Class XII
          </h3>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={step2.showMarks12th}
              onChange={(e) => update("showMarks12th", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <p className="font-manrope text-xs text-muted-foreground">
              Show Class XII marks
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Percentage / CGPA
              </label>
              <input
                type="number"
                step="0.1"
                value={step2.marks12th}
                onChange={(e) => update("marks12th", e.target.value)}
                placeholder="92.4"
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Board
              </label>
              <input
                type="text"
                value={step2.board12th}
                onChange={(e) => update("board12th", e.target.value)}
                placeholder="CBSE"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                School name
              </label>
              <input
                type="text"
                value={step2.schoolName12th}
                onChange={(e) => update("schoolName12th", e.target.value)}
                placeholder="e.g. St. Joseph School"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── 10th ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Class X
          </h3>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={step2.showMarks10th}
              onChange={(e) => update("showMarks10th", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <p className="font-manrope text-xs text-muted-foreground">
              Show Class X marks
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Percentage / CGPA
              </label>
              <input
                type="number"
                step="0.1"
                value={step2.marks10th}
                onChange={(e) => update("marks10th", e.target.value)}
                placeholder="95.0"
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Board
              </label>
              <input
                type="text"
                value={step2.board10th}
                onChange={(e) => update("board10th", e.target.value)}
                placeholder="CBSE"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                School name
              </label>
              <input
                type="text"
                value={step2.schoolName10th}
                onChange={(e) => update("schoolName10th", e.target.value)}
                placeholder="e.g. St. Joseph School"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── Coursework tags ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Relevant coursework
          </h3>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={step2.showCoursework}
              onChange={(e) => update("showCoursework", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <p className="font-manrope text-xs text-muted-foreground">
              Show coursework section
            </p>
          </div>
          <p className="font-manrope mb-3 text-xs text-muted-foreground">
            Add subjects relevant to the roles you&apos;re applying for. Press
            Enter to add.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={courseInput}
              onChange={(e) => setCourseInput(e.target.value)}
              onKeyDown={handleCourseKeyDown}
              placeholder="e.g. Data Structures, Operating Systems"
              className="font-manrope flex-1 rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addCourse}
              className="rounded-xl bg-foreground/10 px-4 py-3 font-manrope text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              Add
            </button>
          </div>
          {step2.coursework.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step2.coursework.map((course) => (
                <span
                  key={course}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-manrope text-xs text-foreground"
                >
                  {course}
                  <button
                    type="button"
                    onClick={() => removeCourse(course)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── Navigation ─── */}
        <motion.div
          variants={item}
          className="flex items-center justify-between border-t border-border/40 pt-6"
        >
          <Link
            href="/form/personal"
            className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Personal
          </Link>
          <Link
            href="/form/skills"
            className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30"
          >
            Next: Skills & Projects →
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}