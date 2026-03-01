"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Internship, Achievement, Bullet } from "@/store/resumeStore";
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

const emptyInternship = (): Internship => ({
  company: "",
  role: "",
  description: "",
  bullets: [{ text: "" }],
  startDate: "",
  endDate: "",
});

const emptyAchievement = (): Achievement => ({
  title: "",
  description: "",
  link: "",
  type: "OTHER",
});

export default function ExperiencePage() {
  const { step4, updateStep4 } = useResumeStore();

  useEffect(() => {
    if (step4.internships.length === 0) {
      updateStep4({ internships: [emptyInternship()] });
    }
  }, [step4.internships.length, updateStep4]);

  useEffect(() => {
    if (step4.achievements.length === 0) {
      updateStep4({ achievements: [emptyAchievement()] });
    }
  }, [step4.achievements.length, updateStep4]);

  const internships =
    step4.internships.length > 0 ? step4.internships : [emptyInternship()];
  const achievements =
    step4.achievements.length > 0 ? step4.achievements : [emptyAchievement()];

  // ── Internships ──
  const addInternship = () =>
    updateStep4({ internships: [...step4.internships, emptyInternship()] });

  const removeInternship = (index: number) => {
    if (step4.internships.length <= 1) return;
    updateStep4({
      internships: step4.internships.filter((_, i) => i !== index),
    });
  };

  const updateInternship = (
    index: number,
    field: keyof Internship,
    value: string | Bullet[]
  ) => {
    updateStep4({
      internships: step4.internships.map((i, idx) =>
        idx === index ? { ...i, [field]: value } : i
      ),
    });
  };

  const addInternBullet = (intIndex: number) => {
    const intern = step4.internships[intIndex];
    if (!intern) return;
    updateInternship(intIndex, "bullets", [
      ...(intern.bullets || []),
      { text: "" },
    ]);
  };

  const updateInternBullet = (intIndex: number, bIndex: number, text: string) => {
    const intern = step4.internships[intIndex];
    if (!intern) return;
    updateInternship(
      intIndex,
      "bullets",
      (intern.bullets || []).map((b, i) => (i === bIndex ? { ...b, text } : b))
    );
  };

  const removeInternBullet = (intIndex: number, bIndex: number) => {
    const intern = step4.internships[intIndex];
    if (!intern || (intern.bullets || []).length <= 1) return;
    updateInternship(
      intIndex,
      "bullets",
      (intern.bullets || []).filter((_, i) => i !== bIndex)
    );
  };

  // ── Achievements ──
  const addAchievement = () =>
    updateStep4({
      achievements: [...step4.achievements, emptyAchievement()],
    });

  const removeAchievement = (index: number) => {
    if (step4.achievements.length <= 1) return;
    updateStep4({
      achievements: step4.achievements.filter((_, i) => i !== index),
    });
  };

  const updateAchievement = (
    index: number,
    field: keyof Achievement,
    value: string
  ) => {
    updateStep4({
      achievements: step4.achievements.map((a, idx) =>
        idx === index ? { ...a, [field]: value } : a
      ),
    });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
          Step 4 of 5
        </p>
        <h1 className="font-instrument-serif mt-1 text-2xl tracking-wide text-foreground sm:text-3xl">
          Experience & Achievements
        </h1>
        <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
          Add internships with structured bullet points, and any competitions,
          certifications, or community involvement.
        </p>
      </motion.div>

      <form className="flex flex-col gap-10">
        {/* ─── Internships ─── */}
        <motion.div variants={item}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Internships / Work experience
            </h3>
            <button
              type="button"
              onClick={addInternship}
              className="font-manrope rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              + Add internship
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-4">
              {internships.map((intern, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-dm-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
                      Internship {index + 1}
                    </span>
                    {internships.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInternship(index)}
                        className="font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Company <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={intern.company}
                          onChange={(e) =>
                            updateInternship(index, "company", e.target.value)
                          }
                          placeholder="Google"
                          required
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Role <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={intern.role}
                          onChange={(e) =>
                            updateInternship(index, "role", e.target.value)
                          }
                          placeholder="Software Engineering Intern"
                          required
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Bullet points */}
                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Bullet points
                      </label>
                      <p className="font-manrope mb-2 text-[11px] text-muted-foreground">
                        Describe your work with action-verb bullets.
                      </p>
                      <div className="flex flex-col gap-2">
                        {(intern.bullets || []).map((bullet, bIndex) => (
                          <div key={bIndex} className="flex items-start gap-2">
                            <span className="mt-3 text-muted-foreground">•</span>
                            <textarea
                              value={bullet.text}
                              onChange={(e) =>
                                updateInternBullet(index, bIndex, e.target.value)
                              }
                              rows={2}
                              placeholder="Developed REST APIs serving 10k+ daily requests..."
                              className="font-manrope flex-1 resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            {(intern.bullets || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInternBullet(index, bIndex)}
                                className="mt-2 text-xs text-muted-foreground transition-colors hover:text-red-500"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addInternBullet(index)}
                        className="mt-2 font-manrope text-xs text-primary transition-colors hover:text-primary/80"
                      >
                        + Add bullet point
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Start date
                        </label>
                        <input
                          type="month"
                          value={intern.startDate}
                          onChange={(e) =>
                            updateInternship(index, "startDate", e.target.value)
                          }
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          End date
                        </label>
                        <input
                          type="month"
                          value={intern.endDate}
                          onChange={(e) =>
                            updateInternship(index, "endDate", e.target.value)
                          }
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </motion.div>

        {/* ─── Achievements ─── */}
        <motion.div variants={item}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Achievements & Certifications
            </h3>
            <button
              type="button"
              onClick={addAchievement}
              className="font-manrope rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              + Add achievement
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-dm-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
                      Achievement {index + 1}
                    </span>
                    {achievements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAchievement(index)}
                        className="font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={achievement.title}
                          onChange={(e) =>
                            updateAchievement(index, "title", e.target.value)
                          }
                          placeholder="Runner-Up at Salesforce Crosswalk '25"
                          required
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Type
                        </label>
                        <select
                          value={achievement.type || "OTHER"}
                          onChange={(e) =>
                            updateAchievement(index, "type", e.target.value)
                          }
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="COMPETITION">Competition</option>
                          <option value="HACKATHON">Hackathon</option>
                          <option value="CERTIFICATION">Certification</option>
                          <option value="PUBLICATION">Publication</option>
                          <option value="COMMUNITY">Community</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Description
                      </label>
                      <textarea
                        value={achievement.description}
                        onChange={(e) =>
                          updateAchievement(index, "description", e.target.value)
                        }
                        placeholder="Led a team of 6 to build an AI-powered system. Competed against 1500+ teams nationally."
                        rows={2}
                        className="font-manrope w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Link
                      </label>
                      <input
                        type="url"
                        value={achievement.link || ""}
                        onChange={(e) =>
                          updateAchievement(index, "link", e.target.value)
                        }
                        placeholder="https://certificate-url.com"
                        className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </motion.div>

        {/* ─── Navigation ─── */}
        <motion.div
          variants={item}
          className="flex items-center justify-between border-t border-border/40 pt-6"
        >
          <Link
            href="/form/skills"
            className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Skills & Projects
          </Link>
          <Link
            href="/form/summary"
            className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30"
          >
            Next: Summary →
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}
