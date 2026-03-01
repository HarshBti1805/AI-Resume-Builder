"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
            Organise skills by category (e.g. Languages, Frameworks). Press
            Enter to add each skill.
          </p>

          <div className="flex flex-col gap-4">
            {categories.map((cat, catIndex) => (
              <div
                key={catIndex}
                className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <select
                    value={cat.name}
                    onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                    className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select category...</option>
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {cat.name &&
                      !DEFAULT_CATEGORIES.includes(cat.name) && (
                        <option value={cat.name}>{cat.name}</option>
                      )}
                  </select>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                    placeholder="or type custom..."
                    className="font-manrope flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(catIndex)}
                      className="font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
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
                    placeholder={`Add ${cat.name || "skills"}...`}
                    className="font-manrope flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => addSkillToCategory(catIndex)}
                    className="rounded-lg bg-foreground/10 px-3 py-2 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
                  >
                    Add
                  </button>
                </div>

                {cat.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cat.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 font-manrope text-xs text-foreground"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            removeSkillFromCategory(catIndex, skill)
                          }
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
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
              placeholder="New category name..."
              className="font-manrope flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addCategory}
              className="rounded-lg bg-foreground/10 px-4 py-2.5 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
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
                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Bullet points <span className="text-red-400">*</span>
                      </label>
                      <p className="font-manrope mb-2 text-[11px] text-muted-foreground">
                        3-5 bullets recommended. Start each with an action verb.
                      </p>
                      <div className="flex flex-col gap-2">
                        {(project.bullets || []).map((bullet, bIndex) => (
                          <div
                            key={bIndex}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-3 text-muted-foreground">•</span>
                            <textarea
                              value={bullet.text}
                              onChange={(e) =>
                                updateBullet(index, bIndex, e.target.value)
                              }
                              rows={2}
                              placeholder="Engineered a scalable platform designed to..."
                              className="font-manrope flex-1 resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            {(project.bullets || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBullet(index, bIndex)}
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
                        onClick={() => addBullet(index)}
                        className="mt-2 font-manrope text-xs text-primary transition-colors hover:text-primary/80"
                      >
                        + Add bullet point
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
          <Link
            href="/form/experience"
            className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30"
          >
            Next: Experience →
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}
