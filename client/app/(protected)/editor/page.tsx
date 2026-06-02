"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useResumeStore } from "@/store/resumeStore";
import { LivePreview } from "@/components/preview/LivePreview";
import { TemplateSwitch } from "@/components/form/TemplateSwitch";
import { SectionList } from "@/components/editor/SectionList";
import { BulletEditor } from "@/components/editor/BulletEditor";
import { StyleControls } from "@/components/editor/StyleControls";
import { CustomSectionEditor } from "@/components/editor/CustomSectionEditor";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";
import type { Bullet } from "@/store/resumeStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ─── Shared field primitives (consistent, always-visible inputs) ──────────
const FIELD_CLASS =
  "font-manrope w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15";
const CARD_CLASS = "rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm";
const SECTION_TITLE_CLASS =
  "font-space-grotesk text-sm font-semibold text-foreground";
const GHOST_BTN_CLASS =
  "font-manrope rounded-lg bg-foreground/[0.06] px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/[0.12]";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="font-dm-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD_CLASS} ${props.className ?? ""}`} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${FIELD_CLASS} resize-y leading-relaxed ${props.className ?? ""}`}
    />
  );
}

function RemoveButton({
  onClick,
  label = "Remove",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-md px-2 py-1 font-manrope text-xs text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
    >
      {label}
    </button>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (!v || tags.includes(v)) return;
    onChange([...tags, v]);
    setVal("");
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <TextInput
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder || "Type and press Enter…"}
        />
        <button type="button" onClick={add} className={`${GHOST_BTN_CLASS} shrink-0`}>
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-1 font-manrope text-xs text-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="rounded-full text-muted-foreground transition-colors hover:text-red-500"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  const {
    resumeId,
    initResume,
    loadResume,
    step1,
    step2,
    step3,
    step4,
    step5,
    updateStep1,
    updateStep2,
    updateStep3,
    updateStep4,
    updateStep5,
    saveAllSteps,
    isSaving,
  } = useResumeStore();

  const [activeSection, setActiveSection] = useState("summary");
  const [initDone, setInitDone] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => setTimeout(r, 50));
      const currentResumeId = useResumeStore.getState().resumeId;
      if (currentResumeId) {
        try {
          if (useResumeStore.getState().isSaving) {
            await new Promise((r) => setTimeout(r, 1200));
          }
          await loadResume(currentResumeId);
        } catch {
          await initResume();
        }
      } else {
        await initResume();
      }
      if (!cancelled) setInitDone(true);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loadResume, initResume, isSaving]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveAllSteps();
    } catch {
      // handled by store
    } finally {
      setSaving(false);
    }
  }, [saveAllSteps]);

  const handleSectionOrder = useCallback(
    async (order: string[]) => {
      if (!resumeId) return;
      try {
        await fetch(`${API_BASE}/resume/${resumeId}/sections/order`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sectionOrder: order }),
        });
      } catch {
        // silently fail
      }
    },
    [resumeId]
  );

  if (!initDone) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <p className="font-manrope text-sm text-muted-foreground">
            Loading editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ─── Navbar: fixed height, no overlap ─── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-background px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/preview"
            className="shrink-0 font-manrope text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Preview
          </Link>
          <span className="hidden shrink-0 font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 sm:inline">
            Editing Room
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <TemplateSwitch />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-foreground px-4 py-1.5 font-manrope text-xs font-medium text-background transition-all hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <UserProfileButton inline />
          <ThemeToggle className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-muted" />
        </div>
      </header>

      {/* ─── Mobile tab toggle ─── */}
      <div className="flex shrink-0 border-b border-border/40 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("edit")}
          className={`flex-1 py-2 text-center font-manrope text-xs font-medium transition-colors ${
            mobileTab === "edit"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 text-center font-manrope text-xs font-medium transition-colors ${
            mobileTab === "preview"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Preview
        </button>
      </div>

      {/* ─── Main split ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: section nav + content */}
        <div
          className={`flex flex-1 flex-col overflow-hidden lg:flex ${
            mobileTab === "edit" ? "flex" : "hidden"
          }`}
        >
          <div className="flex flex-1 overflow-hidden">
            {/* Section nav sidebar */}
            <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-border/40 p-3 lg:block">
              <p className="mb-2 font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                Sections
              </p>
              <SectionList
                activeSection={activeSection}
                onSectionClick={setActiveSection}
                onOrderChange={handleSectionOrder}
              />
            </aside>

            {/* Section content */}
            <main className="flex-1 overflow-y-auto p-6">
              {activeSection === "summary" && (
                <SummarySection
                  summary={step5.summary}
                  onChange={(s) => updateStep5({ summary: s })}
                />
              )}
              {activeSection === "education" && (
                <EducationSection
                  step2={step2}
                  onChange={updateStep2}
                />
              )}
              {activeSection === "skills" && (
                <SkillsSection
                  skillCategories={step3.skillCategories}
                  onChange={(cats) => updateStep3({ skillCategories: cats })}
                />
              )}
              {activeSection === "experience" && (
                <ExperienceSection
                  internships={step4.internships}
                  onChange={(ints) => updateStep4({ internships: ints })}
                />
              )}
              {activeSection === "projects" && (
                <ProjectsSection
                  projects={step3.projects}
                  onChange={(projs) => updateStep3({ projects: projs })}
                />
              )}
              {activeSection === "achievements" && (
                <AchievementsSection
                  achievements={step4.achievements}
                  onChange={(achs) => updateStep4({ achievements: achs })}
                />
              )}
              {activeSection === "hobbies" && (
                <HobbiesSection
                  hobbyItems={step5.hobbyItems}
                  onChange={(items) => updateStep5({ hobbyItems: items })}
                />
              )}

              {/* ─── Custom sections ─── */}
              <div className="mt-8 border-t border-border/40 pt-6">
                <CustomSectionEditor />
              </div>

              {/* ─── Style controls below content ─── */}
              <div className="mt-8">
                <StyleControls />
              </div>
            </main>
          </div>
        </div>

        {/* Right panel: live preview */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-l border-border/40 bg-muted/20 p-4 lg:flex lg:w-[45%] lg:flex-col ${
            mobileTab === "preview" ? "flex flex-col" : "hidden"
          }`}
        >
          <LivePreview />
        </div>
      </div>
    </div>
  );
}

// ─── Inline section editors ────────────────────────────────

function SummarySection({
  summary,
  onChange,
}: {
  summary: string;
  onChange: (s: string) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Professional Summary</h2>
      <TextArea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="A 2-3 sentence summary highlighting your key skills and goals..."
      />
    </div>
  );
}

function EducationSection({
  step2,
  onChange,
}: {
  step2: ReturnType<typeof useResumeStore.getState>["step2"];
  onChange: (data: Partial<typeof step2>) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Education</h2>
      <div className="flex flex-col gap-4">
        <Field label="University">
          <TextInput
            value={step2.university}
            onChange={(e) => onChange({ university: e.target.value })}
            placeholder="Chitkara University"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Stream">
            <TextInput
              value={step2.stream}
              onChange={(e) => onChange({ stream: e.target.value })}
              placeholder="B.E."
            />
          </Field>
          <Field label="Branch">
            <TextInput
              value={step2.branch}
              onChange={(e) => onChange({ branch: e.target.value })}
              placeholder="Computer Science"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="CGPA">
            <TextInput
              value={step2.cgpa}
              onChange={(e) => onChange({ cgpa: e.target.value })}
              placeholder="9.2"
            />
          </Field>
          <Field label="Start year">
            <TextInput
              value={step2.batchStart}
              onChange={(e) => onChange({ batchStart: e.target.value })}
              placeholder="2023"
            />
          </Field>
          <Field label="End year">
            <TextInput
              value={step2.batchEnd}
              onChange={(e) => onChange({ batchEnd: e.target.value })}
              placeholder="2027"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function SkillsSection({
  skillCategories,
  onChange,
}: {
  skillCategories: { name: string; skills: string[] }[];
  onChange: (cats: { name: string; skills: string[] }[]) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Skills</h2>
      <div className="flex flex-col gap-4">
        {skillCategories.map((cat, ci) => (
          <div key={ci} className={CARD_CLASS}>
            <div className="mb-3 flex items-end gap-2">
              <Field label="Category">
                <TextInput
                  value={cat.name}
                  onChange={(e) =>
                    onChange(
                      skillCategories.map((c, i) =>
                        i === ci ? { ...c, name: e.target.value } : c
                      )
                    )
                  }
                  placeholder="e.g. Languages"
                />
              </Field>
              {skillCategories.length > 1 && (
                <RemoveButton
                  onClick={() =>
                    onChange(skillCategories.filter((_, i) => i !== ci))
                  }
                />
              )}
            </div>
            <Field label="Skills">
              <TagInput
                tags={cat.skills}
                onChange={(skills) =>
                  onChange(
                    skillCategories.map((c, i) =>
                      i === ci ? { ...c, skills } : c
                    )
                  )
                }
                placeholder="Add a skill and press Enter…"
              />
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([...skillCategories, { name: "", skills: [] }])
          }
          className={`${GHOST_BTN_CLASS} self-start`}
        >
          + Add category
        </button>
      </div>
    </div>
  );
}

function ExperienceSection({
  internships,
  onChange,
}: {
  internships: ReturnType<typeof useResumeStore.getState>["step4"]["internships"];
  onChange: (ints: typeof internships) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Experience</h2>
      <div className="flex flex-col gap-4">
        {internships.map((intern, i) => (
          <div key={i} className={CARD_CLASS}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Experience {i + 1}
              </span>
              {internships.length > 1 && (
                <RemoveButton
                  onClick={() =>
                    onChange(internships.filter((_, idx) => idx !== i))
                  }
                />
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Role">
                  <TextInput
                    value={intern.role}
                    onChange={(e) =>
                      onChange(
                        internships.map((x, idx) =>
                          idx === i ? { ...x, role: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Software Engineering Intern"
                  />
                </Field>
                <Field label="Company">
                  <TextInput
                    value={intern.company}
                    onChange={(e) =>
                      onChange(
                        internships.map((x, idx) =>
                          idx === i ? { ...x, company: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Google"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Start date">
                  <TextInput
                    type="month"
                    value={intern.startDate}
                    onChange={(e) =>
                      onChange(
                        internships.map((x, idx) =>
                          idx === i ? { ...x, startDate: e.target.value } : x
                        )
                      )
                    }
                  />
                </Field>
                <Field label="End date">
                  <TextInput
                    type="month"
                    value={intern.endDate}
                    onChange={(e) =>
                      onChange(
                        internships.map((x, idx) =>
                          idx === i ? { ...x, endDate: e.target.value } : x
                        )
                      )
                    }
                  />
                </Field>
              </div>
              <Field label="Bullet points">
                <BulletEditor
                  bullets={intern.bullets || []}
                  onChange={(bullets: Bullet[]) =>
                    onChange(
                      internships.map((x, idx) =>
                        idx === i ? { ...x, bullets } : x
                      )
                    )
                  }
                  placeholder="Describe your work…"
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([
              ...internships,
              {
                company: "",
                role: "",
                description: "",
                bullets: [{ text: "" }],
                startDate: "",
                endDate: "",
              },
            ])
          }
          className={`${GHOST_BTN_CLASS} self-start`}
        >
          + Add experience
        </button>
      </div>
    </div>
  );
}

function ProjectsSection({
  projects,
  onChange,
}: {
  projects: ReturnType<typeof useResumeStore.getState>["step3"]["projects"];
  onChange: (projs: typeof projects) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Projects</h2>
      <div className="flex flex-col gap-4">
        {projects.map((proj, i) => (
          <div key={i} className={CARD_CLASS}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Project {i + 1}
              </span>
              {projects.length > 1 && (
                <RemoveButton
                  onClick={() =>
                    onChange(projects.filter((_, idx) => idx !== i))
                  }
                />
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <TextInput
                    value={proj.title}
                    onChange={(e) =>
                      onChange(
                        projects.map((x, idx) =>
                          idx === i ? { ...x, title: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Heritage Threads"
                  />
                </Field>
                <Field label="Subtitle / Tagline">
                  <TextInput
                    value={proj.subtitle || ""}
                    onChange={(e) =>
                      onChange(
                        projects.map((x, idx) =>
                          idx === i ? { ...x, subtitle: e.target.value } : x
                        )
                      )
                    }
                    placeholder="AI-powered eCommerce platform"
                  />
                </Field>
              </div>
              <Field label="Tech stack">
                <TagInput
                  tags={proj.techStack || []}
                  onChange={(techStack) =>
                    onChange(
                      projects.map((x, idx) =>
                        idx === i ? { ...x, techStack } : x
                      )
                    )
                  }
                  placeholder="React, Node.js…"
                />
              </Field>
              <Field label="Bullet points">
                <BulletEditor
                  bullets={proj.bullets || []}
                  onChange={(bullets: Bullet[]) =>
                    onChange(
                      projects.map((x, idx) =>
                        idx === i ? { ...x, bullets } : x
                      )
                    )
                  }
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Live URL">
                  <TextInput
                    type="url"
                    value={proj.liveUrl || ""}
                    onChange={(e) =>
                      onChange(
                        projects.map((x, idx) =>
                          idx === i ? { ...x, liveUrl: e.target.value } : x
                        )
                      )
                    }
                    placeholder="https://myapp.vercel.app"
                  />
                </Field>
                <Field label="Repository URL">
                  <TextInput
                    type="url"
                    value={proj.repoUrl || ""}
                    onChange={(e) =>
                      onChange(
                        projects.map((x, idx) =>
                          idx === i ? { ...x, repoUrl: e.target.value } : x
                        )
                      )
                    }
                    placeholder="https://github.com/user/repo"
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([
              ...projects,
              {
                title: "",
                subtitle: "",
                description: "",
                bullets: [{ text: "" }],
                techStack: [],
                liveUrl: "",
                repoUrl: "",
              },
            ])
          }
          className={`${GHOST_BTN_CLASS} self-start`}
        >
          + Add project
        </button>
      </div>
    </div>
  );
}

function AchievementsSection({
  achievements,
  onChange,
}: {
  achievements: ReturnType<typeof useResumeStore.getState>["step4"]["achievements"];
  onChange: (achs: typeof achievements) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Achievements</h2>
      <div className="flex flex-col gap-4">
        {achievements.map((ach, i) => (
          <div key={i} className={CARD_CLASS}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Achievement {i + 1}
              </span>
              {achievements.length > 1 && (
                <RemoveButton
                  onClick={() =>
                    onChange(achievements.filter((_, idx) => idx !== i))
                  }
                />
              )}
            </div>
            <div className="flex flex-col gap-4">
              <Field label="Title" required>
                <TextInput
                  value={ach.title}
                  onChange={(e) =>
                    onChange(
                      achievements.map((a, idx) =>
                        idx === i ? { ...a, title: e.target.value } : a
                      )
                    )
                  }
                  placeholder="Runner-Up at Salesforce Crosswalk '25"
                />
              </Field>
              <Field label="Description">
                <TextArea
                  value={ach.description || ""}
                  rows={2}
                  onChange={(e) =>
                    onChange(
                      achievements.map((a, idx) =>
                        idx === i ? { ...a, description: e.target.value } : a
                      )
                    )
                  }
                  placeholder="Led a team of 6 to build an AI-powered system…"
                />
              </Field>
              <Field label="Link">
                <TextInput
                  type="url"
                  value={ach.link || ""}
                  onChange={(e) =>
                    onChange(
                      achievements.map((a, idx) =>
                        idx === i ? { ...a, link: e.target.value } : a
                      )
                    )
                  }
                  placeholder="https://certificate-url.com"
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([
              ...achievements,
              { title: "", description: "", link: "", type: "OTHER" as const },
            ])
          }
          className={`${GHOST_BTN_CLASS} self-start`}
        >
          + Add achievement
        </button>
      </div>
    </div>
  );
}

function HobbiesSection({
  hobbyItems,
  onChange,
}: {
  hobbyItems: ReturnType<typeof useResumeStore.getState>["step5"]["hobbyItems"];
  onChange: (items: typeof hobbyItems) => void;
}) {
  return (
    <div>
      <h2 className={`${SECTION_TITLE_CLASS} mb-3`}>Hobbies & Interests</h2>
      <div className="flex flex-col gap-3">
        {hobbyItems.map((h, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <TextInput
              value={h.name}
              onChange={(e) =>
                onChange(
                  hobbyItems.map((x, idx) =>
                    idx === i ? { ...x, name: e.target.value } : x
                  )
                )
              }
              placeholder="Hobby name"
              className="sm:max-w-[12rem]"
            />
            <TextInput
              value={h.description || ""}
              onChange={(e) =>
                onChange(
                  hobbyItems.map((x, idx) =>
                    idx === i ? { ...x, description: e.target.value } : x
                  )
                )
              }
              placeholder="Brief description (optional)"
            />
            <RemoveButton
              label="×"
              onClick={() => onChange(hobbyItems.filter((_, idx) => idx !== i))}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([...hobbyItems, { name: "", description: "" }])
          }
          className={`${GHOST_BTN_CLASS} self-start`}
        >
          + Add hobby
        </button>
      </div>
    </div>
  );
}
