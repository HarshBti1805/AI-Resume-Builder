"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/store/resumeStore";
import type { HobbyItem } from "@/store/resumeStore";

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

export default function SummaryPage() {
  const router = useRouter();
  const { step5, updateStep5, saveAllSteps } = useResumeStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const hobbyItems = step5.hobbyItems || [];

  const addHobby = () => {
    updateStep5({
      hobbyItems: [...hobbyItems, { name: "", description: "" }],
    });
  };

  const updateHobby = (index: number, field: keyof HobbyItem, value: string) => {
    updateStep5({
      hobbyItems: hobbyItems.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    });
  };

  const removeHobby = (index: number) => {
    updateStep5({
      hobbyItems: hobbyItems.filter((_, i) => i !== index),
    });
  };

  const handleGenerateSummary = async () => {
    const { resumeId, step2, step3, step4 } = useResumeStore.getState();
    if (!resumeId) return;
    setIsGenerating(true);
    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

      // Use live (unsaved) form state so AI generation reflects current edits.
      const skills =
        (step3.skillCategories ?? []).flatMap((c) => c.skills ?? []);
      const projects = (step3.projects ?? []).map((p) => ({ title: p.title }));
      const internships = (step4.internships ?? []).map((i) => ({
        role: i.role,
        company: i.company,
      }));

      const res = await fetch(`${API_BASE}/ai/generate-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          resumeId,
          data: {
            stream: step2.stream,
            university: step2.university,
            skills,
            projects,
            internships,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.summary) {
        updateStep5({ summary: data.data.summary });
      }
    } catch {
      // silently fail
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await saveAllSteps();
      router.push("/preview");
    } catch {
      // saveError is set in store; layout shows it
    } finally {
      setIsFinishing(false);
    }
  };

  const handleOpenEditor = async () => {
    setIsFinishing(true);
    try {
      await saveAllSteps();
      router.push("/editor");
    } catch {
      // saveError is set in store; layout shows it
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
          Step 5 of 5
        </p>
        <h1 className="font-instrument-serif mt-1 text-2xl tracking-wide text-foreground sm:text-3xl">
          Summary & Hobbies
        </h1>
        <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
          The professional summary sits at the top of your resume &mdash; it&apos;s
          the first thing recruiters read. Use AI to generate one, or write your
          own. Add hobbies to show personality.
        </p>
      </motion.div>

      <form className="flex flex-col gap-10">
        {/* ─── Professional Summary ─── */}
        <motion.div variants={item}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Professional summary
            </h3>
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground/10 px-3 py-1.5 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border border-foreground/30 border-t-foreground" />
                  Generating&hellip;
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Generate with AI
                </>
              )}
            </button>
          </div>

          <textarea
            value={step5.summary}
            onChange={(e) => updateStep5({ summary: e.target.value })}
            placeholder="A 2-3 sentence summary highlighting your key skills, experience, and what you're looking for. Keep it specific — avoid generic phrases like 'hard-working team player'."
            rows={5}
            className="font-manrope w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground leading-relaxed placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="mt-2 flex items-center justify-between">
            <p className="font-manrope text-xs text-muted-foreground/60">
              {step5.summary.length > 0 && (
                <span>
                  {step5.summary.split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </p>
            {step5.summary && (
              <button
                type="button"
                onClick={() => updateStep5({ summary: "" })}
                className="font-manrope text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.03] px-4 py-3">
            <p className="font-manrope text-xs leading-relaxed text-muted-foreground">
              <span className="font-space-grotesk font-semibold text-foreground">
                Tip:
              </span>{" "}
              Click &quot;Generate with AI&quot; to create a summary from your
              form data. You can always edit it afterwards. A good summary
              mentions your degree, top 2-3 skills, and what kind of role
              you&apos;re targeting.
            </p>
          </div>
        </motion.div>

        {/* ─── Hobbies ─── */}
        <motion.div variants={item}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                Hobbies & Interests
              </h3>
              <p className="font-manrope mt-1 text-xs text-muted-foreground">
                Optional but recommended. Add a short description for context.
              </p>
            </div>
            <button
              type="button"
              onClick={addHobby}
              className="font-manrope rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              + Add hobby
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {hobbyItems.map((hobby, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm"
                >
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <input
                      type="text"
                      value={hobby.name}
                      onChange={(e) =>
                        updateHobby(index, "name", e.target.value)
                      }
                      placeholder="Hobby name"
                      className="font-manrope w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-1/3"
                    />
                    <input
                      type="text"
                      value={hobby.description || ""}
                      onChange={(e) =>
                        updateHobby(index, "description", e.target.value)
                      }
                      placeholder="Brief description (optional)"
                      className="font-manrope flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHobby(index)}
                    className="mt-2 text-xs text-muted-foreground transition-colors hover:text-red-500"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {hobbyItems.length === 0 && (
            <div className="mt-2 rounded-xl border border-dashed border-border/50 p-4 text-center">
              <p className="font-manrope text-xs text-muted-foreground/60">
                No hobbies added yet. Click &quot;+ Add hobby&quot; to start.
              </p>
            </div>
          )}
        </motion.div>

        {/* ─── Completion card ─── */}
        <motion.div variants={item}>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-center backdrop-blur-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/[0.07]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground/70"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="font-space-grotesk text-sm font-semibold text-foreground">
              Almost done!
            </h3>
            <p className="font-manrope mt-1 text-sm text-muted-foreground">
              After this step, you&apos;ll preview your resume and download the
              PDF. You can still change the template anytime.
            </p>
          </div>
        </motion.div>

        {/* ─── Navigation ─── */}
        <motion.div
          variants={item}
          className="flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <Link
            href="/form/experience"
            className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Experience
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenEditor}
              disabled={isFinishing}
              className="font-manrope inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {isFinishing ? "Saving…" : "Edit in editor"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
            >
              {isFinishing ? "Saving\u2026" : "Preview & Download \u2192"}
            </button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
