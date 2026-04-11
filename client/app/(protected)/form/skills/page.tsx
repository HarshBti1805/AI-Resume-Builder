"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FormNavLink } from "@/components/form/FormNavLink";
import { isStep3Complete } from "@/lib/formStepGating";
import type { Project, Bullet, SkillCategory } from "@/store/resumeStore";
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

const DEFAULT_CATEGORIES = [
  "Languages",
  "Frameworks & Libraries",
  "Database",
  "DevOps",
  "AI/ML & Generative AI",
  "Soft Skills",
];

const emptyProject = (): Project => ({
  title: "",
  subtitle: "",
  description: "",
  bullets: [{ text: "" }],
  techStack: [],
  liveUrl: "",
  repoUrl: "",
});

const emptyCategory = (): SkillCategory => ({
  name: "",
  skills: [],
});

const CUSTOM_CATEGORY = "__custom__";

function categorySelectValue(name: string): string {
  if (!name) return "";
  if (DEFAULT_CATEGORIES.includes(name)) return name;
  return CUSTOM_CATEGORY;
}

export default function SkillsPage() {
  const { step3, updateStep3 } = useResumeStore();
  const [techInputs, setTechInputs] = useState<Record<string, string>>({});
  const [skillInputs, setSkillInputs] = useState<Record<number, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (step3.projects.length === 0) {
      updateStep3({ projects: [emptyProject()] });
    }
  }, [step3.projects.length, updateStep3]);

  useEffect(() => {
    if (step3.skillCategories.length === 0) {
      updateStep3({
        skillCategories: [
          { name: "Languages", skills: [] },
          { name: "Frameworks & Libraries", skills: [] },
        ],
      });
    }
  }, [step3.skillCategories.length, updateStep3]);

  const categories =
    step3.skillCategories.length > 0 ? step3.skillCategories : [emptyCategory()];
  const projects = step3.projects.length > 0 ? step3.projects : [emptyProject()];
  const canContinue = isStep3Complete(step3);

  // ── Skill categories ──
  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    updateStep3({
      skillCategories: [...step3.skillCategories, { name, skills: [] }],
    });
    setNewCategoryName("");
  };

  const removeCategory = (index: number) => {
    updateStep3({
      skillCategories: step3.skillCategories.filter((_, i) => i !== index),
    });
  };

  const updateCategoryName = (index: number, name: string) => {
    updateStep3({
      skillCategories: step3.skillCategories.map((c, i) =>
        i === index ? { ...c, name } : c
      ),
    });
  };

  const addSkillToCategory = (catIndex: number) => {
    const value = (skillInputs[catIndex] || "").trim();
    if (!value) return;
    const cat = step3.skillCategories[catIndex];
    if (cat && !cat.skills.includes(value)) {
      updateStep3({
        skillCategories: step3.skillCategories.map((c, i) =>
          i === catIndex ? { ...c, skills: [...c.skills, value] } : c
        ),
      });
    }
    setSkillInputs((prev) => ({ ...prev, [catIndex]: "" }));
  };

  const removeSkillFromCategory = (catIndex: number, skill: string) => {
    updateStep3({
      skillCategories: step3.skillCategories.map((c, i) =>
        i === catIndex
          ? { ...c, skills: c.skills.filter((s) => s !== skill) }
          : c
      ),
    });
  };

  // ── Projects ──
  const addProject = () => {
    updateStep3({ projects: [...step3.projects, emptyProject()] });
  };

  const removeProject = (index: number) => {
    if (step3.projects.length <= 1) return;
    updateStep3({
      projects: step3.projects.filter((_, i) => i !== index),
    });
  };

  const updateProject = (
    index: number,
    field: keyof Project,
    value: string | string[] | Bullet[]
  ) => {
    updateStep3({
      projects: step3.projects.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    });
  };

  // ── Project bullets ──
  const addBullet = (projIndex: number) => {
    const project = step3.projects[projIndex];
    if (!project) return;
    updateProject(projIndex, "bullets", [
      ...project.bullets,
      { text: "" },
    ]);
  };

  const updateBullet = (projIndex: number, bulletIndex: number, text: string) => {
    const project = step3.projects[projIndex];
    if (!project) return;
    updateProject(
      projIndex,
      "bullets",
      project.bullets.map((b, i) => (i === bulletIndex ? { ...b, text } : b))
    );
  };

  const removeBullet = (projIndex: number, bulletIndex: number) => {
    const project = step3.projects[projIndex];
    if (!project || project.bullets.length <= 1) return;
    updateProject(
      projIndex,
      "bullets",
      project.bullets.filter((_, i) => i !== bulletIndex)
    );
  };

  // ── Tech stack ──
  const addTech = (index: number) => {
    const key = `proj-${index}`;
    const value = (techInputs[key] || "").trim();
    if (!value) return;
    const project = step3.projects[index];
    if (project && !project.techStack.includes(value)) {
      updateProject(index, "techStack", [...project.techStack, value]);
    }
    setTechInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const removeTech = (index: number, tech: string) => {
    const project = step3.projects[index];
    if (project) {
      updateProject(
        index,
        "techStack",
        project.techStack.filter((t) => t !== tech)
      );
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
          Step 3 of 5
        </p>
        <h1 className="font-instrument-serif mt-1 text-2xl tracking-wide text-foreground sm:text-3xl">
          Skills & Projects
        </h1>
        <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
          Organise your skills by category and add projects with structured
          bullet points. These are the most important sections for freshers.
        </p>
      </motion.div>

      <form className="flex flex-col gap-10">
        {/* ─── Skills by Category ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Technical skills
          </h3>
          <p className="font-manrope mb-4 text-xs text-muted-foreground">
            Pick a category, then add skills one at a time (Enter or Add).
            Use <span className="text-foreground/80">Custom category</span> for
            anything not listed.
          </p>

          <div className="flex flex-col gap-4">
            {categories.map((cat, catIndex) => {
              const sel = categorySelectValue(cat.name);
              const showCustomName =
                sel === CUSTOM_CATEGORY ||
                (!!cat.name && !DEFAULT_CATEGORIES.includes(cat.name));

              return (
                <div
                  key={cat.id ?? `skill-cat-${catIndex}`}
                  className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm backdrop-blur-sm sm:p-5"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="font-dm-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                        Category
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={sel}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === CUSTOM_CATEGORY) {
                              updateCategoryName(
                                catIndex,
                                DEFAULT_CATEGORIES.includes(cat.name)
                                  ? ""
                                  : cat.name
                              );
                            } else {
                              updateCategoryName(catIndex, v);
                            }
                          }}
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
                        >
                          <option value="">Select category…</option>
                          {DEFAULT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value={CUSTOM_CATEGORY}>
                            Custom category…
                          </option>
                        </select>
                        {showCustomName && (
                          <input
                            type="text"
                            value={
                              DEFAULT_CATEGORIES.includes(cat.name)
                                ? ""
                                : cat.name
                            }
                            onChange={(e) =>
                              updateCategoryName(catIndex, e.target.value)
                            }
                            placeholder="Name your category"
                            className="font-manrope min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        )}
                      </div>
                    </div>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(catIndex)}
                        className="shrink-0 self-end font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500 sm:self-center"
                      >
                        Remove category
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={skillInputs[catIndex] || ""}
                      onChange={(e) =>
                        setSkillInputs((prev) => ({
                          ...prev,
                          [catIndex]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkillToCategory(catIndex);
                        }
                      }}
                      placeholder="e.g. TypeScript, React, PostgreSQL…"
                      className="font-manrope min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => addSkillToCategory(catIndex)}
                      className="h-10 shrink-0 rounded-xl bg-foreground/10 px-4 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15 sm:h-auto sm:self-stretch sm:py-2.5"
                    >
                      Add skill
                    </button>
                  </div>

                  <div
                    className={`mt-3 min-h-[2.5rem] rounded-xl border border-dashed border-border/50 bg-muted/15 px-3 py-2.5 ${
                      cat.skills.length === 0
                        ? "flex items-center"
                        : "flex flex-wrap gap-2"
                    }`}
                  >
                    {cat.skills.length === 0 ? (
                      <p className="font-manrope text-[11px] text-muted-foreground/70">
                        No skills yet — add keywords recruiters search for.
                      </p>
                    ) : (
                      cat.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 font-manrope text-xs text-foreground"
                        >
                          <span className="truncate">{skill}</span>
                          <button
                            type="button"
                            onClick={() =>
                              removeSkillFromCategory(catIndex, skill)
                            }
                            className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                            aria-label={`Remove ${skill}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="Another category name (optional)"
              className="font-manrope min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addCategory}
              className="h-10 shrink-0 rounded-xl bg-foreground/10 px-4 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15 sm:h-auto sm:py-2.5"
            >
              + Add category
            </button>
          </div>
        </motion.div>

        {/* ─── Projects ─── */}
        <motion.div variants={item}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Projects
            </h3>
            <button
              type="button"
              onClick={addProject}
              className="font-manrope rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              + Add project
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id ?? `project-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-dm-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
                      Project {index + 1}
                    </span>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProject(index)}
                        className="font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {(project.title?.trim() || project.subtitle?.trim()) && (
                    <p className="mb-4 font-manrope text-sm leading-snug text-foreground">
                      {project.title?.trim() && (
                        <span className="font-semibold">{project.title.trim()}</span>
                      )}
                      {project.title?.trim() && project.subtitle?.trim() && (
                        <span className="font-normal text-muted-foreground/60">
                          {" - "}
                        </span>
                      )}
                      {project.subtitle?.trim() && (
                        <span className="font-normal italic text-muted-foreground">
                          {project.subtitle.trim()}
                        </span>
                      )}
                    </p>
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={project.title}
                          onChange={(e) =>
                            updateProject(index, "title", e.target.value)
                          }
                          placeholder="Heritage Threads"
                          required
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Subtitle / Tagline
                        </label>
                        <input
                          type="text"
                          value={project.subtitle || ""}
                          onChange={(e) =>
                            updateProject(index, "subtitle", e.target.value)
                          }
                          placeholder="AI-powered eCommerce platform"
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Tech stack tags */}
                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tech stack
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={techInputs[`proj-${index}`] || ""}
                          onChange={(e) =>
                            setTechInputs((prev) => ({
                              ...prev,
                              [`proj-${index}`]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTech(index);
                            }
                          }}
                          placeholder="React, Node.js..."
                          className="font-manrope flex-1 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => addTech(index)}
                          className="rounded-xl bg-foreground/10 px-3 py-2.5 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
                        >
                          Add
                        </button>
                      </div>
                      {project.techStack.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {project.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.07] px-2 py-1 font-dm-mono text-[11px] text-foreground"
                            >
                              {tech}
                              <button
                                type="button"
                                onClick={() => removeTech(index, tech)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bullet points */}
                    <div className="min-w-0">
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Bullet points <span className="text-red-400">*</span>
                      </label>
                      <p className="font-manrope mb-3 text-[11px] text-muted-foreground">
                        3-5 bullets recommended. Start each with an action verb.
                      </p>
                      <div className="flex flex-col gap-3">
                        {(project.bullets || []).map((bullet, bIndex) => (
                          <div
                            key={bullet.id ?? `b-${index}-${bIndex}`}
                            className="flex min-w-0 items-start gap-2 sm:gap-3"
                          >
                            <span
                              className="mt-[0.85rem] w-5 shrink-0 select-none text-right font-dm-mono text-[11px] font-medium tabular-nums text-muted-foreground sm:mt-[0.9rem] sm:w-6"
                              aria-hidden
                            >
                              {bIndex + 1}.
                            </span>
                            <textarea
                              value={bullet.text}
                              onChange={(e) =>
                                updateBullet(index, bIndex, e.target.value)
                              }
                              rows={3}
                              placeholder="Engineered a scalable platform designed to…"
                              className="font-manrope min-h-[5.5rem] min-w-0 flex-1 resize-y rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            {(project.bullets || []).length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeBullet(index, bIndex)}
                                className="mt-2 shrink-0 font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500"
                                aria-label="Remove bullet"
                              >
                                ×
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addBullet(index)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-foreground/10 px-3 py-2 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
                      >
                        + Add bullet
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Live URL
                        </label>
                        <input
                          type="url"
                          value={project.liveUrl}
                          onChange={(e) =>
                            updateProject(index, "liveUrl", e.target.value)
                          }
                          placeholder="https://myapp.vercel.app"
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Repository URL
                        </label>
                        <input
                          type="url"
                          value={project.repoUrl}
                          onChange={(e) =>
                            updateProject(index, "repoUrl", e.target.value)
                          }
                          placeholder="https://github.com/user/repo"
                          className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
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
            href="/form/academic"
            className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Academics
          </Link>
          <FormNavLink
            href="/form/experience"
            enabled={canContinue}
            className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30"
          >
            Next: Experience →
          </FormNavLink>
        </motion.div>
      </form>
    </motion.div>
  );
}
