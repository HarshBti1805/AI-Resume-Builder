"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function SummaryPage() {
  const router = useRouter();
  const { step5, updateStep5, saveAllSteps } = useResumeStore();
  const [hobbyInput, setHobbyInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const addHobby = () => {
    const trimmed = hobbyInput.trim();
    if (trimmed && !step5.hobbies.includes(trimmed)) {
      updateStep5({ hobbies: [...step5.hobbies, trimmed] });
      setHobbyInput("");
    }
  };

  const removeHobby = (hobby: string) => {
    updateStep5({ hobbies: step5.hobbies.filter((h) => h !== hobby) });
  };

  const handleHobbyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHobby();
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    // TODO: call POST /api/ai/generate-summary with resume data
    // For now, simulate a delay
    setTimeout(() => {
      updateStep5({
        summary:
          "Motivated Computer Science student at Chitkara University with hands-on experience in full-stack development. Built multiple production-ready applications using React, Node.js, and PostgreSQL. Passionate about building tools that solve real problems and eager to contribute to impactful engineering teams.",
      });
      setIsGenerating(false);
    }, 1500);
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
          The professional summary sits at the top of your resume — it&apos;s
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
                  Generating…
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

          {/* AI tip */}
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
          <h3 className="font-space-grotesk mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Hobbies & Interests
          </h3>
          <p className="font-manrope mb-3 text-xs text-muted-foreground">
            Optional but recommended. Shows personality beyond academics. Press
            Enter to add.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={hobbyInput}
              onChange={(e) => setHobbyInput(e.target.value)}
              onKeyDown={handleHobbyKeyDown}
              placeholder="e.g. Open-source contributing, Chess, Photography"
              className="font-manrope flex-1 rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addHobby}
              className="rounded-xl bg-foreground/10 px-4 py-3 font-manrope text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              Add
            </button>
          </div>
          {step5.hobbies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step5.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-manrope text-xs text-foreground"
                >
                  {hobby}
                  <button
                    type="button"
                    onClick={() => removeHobby(hobby)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
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
          className="flex items-center justify-between border-t border-border/40 pt-6"
        >
          <Link
            href="/form/experience"
            className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Experience
          </Link>
          <button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing}
            className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
          >
            {isFinishing ? "Saving…" : "Preview & Download →"}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}