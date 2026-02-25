"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Project } from "@/store/resumeStore";
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

const emptyProject = (): Project => ({
  title: "",
  description: "",
  techStack: [],
  liveUrl: "",
  repoUrl: "",
});

export default function SkillsPage() {
  const { step3, updateStep3 } = useResumeStore();
  const [skillInput, setSkillInput] = useState("");
  const [techInputs, setTechInputs] = useState<Record<string, string>>({});

  // Ensure at least one project
  useEffect(() => {
    if (step3.projects.length === 0) {
      updateStep3({ projects: [emptyProject()] });
    }
  }, [step3.projects.length, updateStep3]);

  const projects = step3.projects.length > 0 ? step3.projects : [emptyProject()];

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !step3.skills.includes(trimmed)) {
      updateStep3({ skills: [...step3.skills, trimmed] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    updateStep3({ skills: step3.skills.filter((s) => s !== skill) });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const addProject = () => {
    updateStep3({
      projects: [...step3.projects, emptyProject()],
    });
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
    value: string | string[]
  ) => {
    updateStep3({
      projects: step3.projects.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    });
  };

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
          Add your technical skills and the projects that showcase them. These
          are the most important sections for freshers — recruiters want to see
          what you&apos;ve built.
        </p>
      </motion.div>

      <form className="flex flex-col gap-10">
        {/* ─── Skills ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Technical skills
          </h3>
          <p className="font-manrope mb-3 text-xs text-muted-foreground">
            Add languages, frameworks, tools. Press Enter to add each one.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="e.g. React, Python, Docker, Figma"
              className="font-manrope flex-1 rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-xl bg-foreground/10 px-4 py-3 font-manrope text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              Add
            </button>
          </div>
          {step3.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step3.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-manrope text-xs text-foreground"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
                        placeholder="Real-time Chat Application"
                        required
                        className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={project.description}
                        onChange={(e) =>
                          updateProject(index, "description", e.target.value)
                        }
                        placeholder="Built a real-time messaging app with Socket.io supporting 100+ concurrent users. Implemented message persistence with MongoDB and JWT-based authentication."
                        rows={3}
                        required
                        className="font-manrope w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
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