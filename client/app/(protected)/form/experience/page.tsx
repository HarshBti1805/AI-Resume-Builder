"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

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

interface Internship {
  id: string;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
}

const emptyInternship = (): Internship => ({
  id: crypto.randomUUID(),
  company: "",
  role: "",
  description: "",
  startDate: "",
  endDate: "",
});

const emptyAchievement = (): Achievement => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  type: "OTHER",
});

export default function ExperiencePage() {
  const [internships, setInternships] = useState<Internship[]>([
    emptyInternship(),
  ]);
  const [achievements, setAchievements] = useState<Achievement[]>([
    emptyAchievement(),
  ]);

  // ─── Internships ───
  const addInternship = () =>
    setInternships((prev) => [...prev, emptyInternship()]);

  const removeInternship = (id: string) => {
    if (internships.length <= 1) return;
    setInternships((prev) => prev.filter((i) => i.id !== id));
  };

  const updateInternship = (
    id: string,
    field: keyof Internship,
    value: string
  ) => {
    setInternships((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // ─── Achievements ───
  const addAchievement = () =>
    setAchievements((prev) => [...prev, emptyAchievement()]);

  const removeAchievement = (id: string) => {
    if (achievements.length <= 1) return;
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAchievement = (
    id: string,
    field: keyof Achievement,
    value: string
  ) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
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
          Internships, work experience, and anything you&apos;ve won or been
          recognised for. Don&apos;t have internships yet? Skip to achievements
          — hackathon wins, certifications, and competitions count.
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
                  key={intern.id}
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
                        onClick={() => removeInternship(intern.id)}
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
                            updateInternship(
                              intern.id,
                              "company",
                              e.target.value
                            )
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
                            updateInternship(intern.id, "role", e.target.value)
                          }
                          placeholder="Software Engineering Intern"
                          required
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Description
                      </label>
                      <textarea
                        value={intern.description}
                        onChange={(e) =>
                          updateInternship(
                            intern.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Developed REST APIs serving 10k+ daily requests. Reduced page load time by 40% through lazy loading and code splitting."
                        rows={3}
                        className="font-manrope w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
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
                            updateInternship(
                              intern.id,
                              "startDate",
                              e.target.value
                            )
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
                            updateInternship(
                              intern.id,
                              "endDate",
                              e.target.value
                            )
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
              Achievements
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
                  key={achievement.id}
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
                        onClick={() => removeAchievement(achievement.id)}
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
                            updateAchievement(
                              achievement.id,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="1st Place — Smart India Hackathon 2025"
                          required
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Type
                        </label>
                        <select
                          value={achievement.type}
                          onChange={(e) =>
                            updateAchievement(
                              achievement.id,
                              "type",
                              e.target.value
                            )
                          }
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="COMPETITION">Competition</option>
                          <option value="HACKATHON">Hackathon</option>
                          <option value="CERTIFICATION">Certification</option>
                          <option value="PUBLICATION">Publication</option>
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
                          updateAchievement(
                            achievement.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Led a team of 6 to build an AI-powered crop disease detection system. Competed against 1500+ teams nationally."
                        rows={2}
                        className="font-manrope w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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