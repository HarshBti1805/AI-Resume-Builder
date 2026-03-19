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
  }, [loadResume, initResume]);

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
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Professional Summary
      </h2>
      <textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="A 2-3 sentence summary highlighting your key skills and goals..."
        className="font-manrope w-full resize-none rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
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
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Education
      </h2>
      <div className="flex flex-col gap-3">
        <input
          value={step2.university}
          onChange={(e) => onChange({ university: e.target.value })}
          placeholder="University"
          className="font-manrope w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={step2.stream}
            onChange={(e) => onChange({ stream: e.target.value })}
            placeholder="Stream"
            className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            value={step2.branch}
            onChange={(e) => onChange({ branch: e.target.value })}
            placeholder="Branch"
            className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input
            value={step2.cgpa}
            onChange={(e) => onChange({ cgpa: e.target.value })}
            placeholder="CGPA"
            className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            value={step2.batchStart}
            onChange={(e) => onChange({ batchStart: e.target.value })}
            placeholder="Start year"
            className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            value={step2.batchEnd}
            onChange={(e) => onChange({ batchEnd: e.target.value })}
            placeholder="End year"
            className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
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
  const [inputs, setInputs] = useState<Record<number, string>>({});

  const addSkill = (catIndex: number) => {
    const val = (inputs[catIndex] || "").trim();
    if (!val) return;
    const cat = skillCategories[catIndex];
    if (!cat || cat.skills.includes(val)) return;
    onChange(
      skillCategories.map((c, i) =>
        i === catIndex ? { ...c, skills: [...c.skills, val] } : c
      )
    );
    setInputs((p) => ({ ...p, [catIndex]: "" }));
  };

  return (
    <div>
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Skills
      </h2>
      <div className="flex flex-col gap-4">
        {skillCategories.map((cat, ci) => (
          <div key={ci} className="rounded-lg border border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={cat.name}
                onChange={(e) =>
                  onChange(
                    skillCategories.map((c, i) =>
                      i === ci ? { ...c, name: e.target.value } : c
                    )
                  )
                }
                className="font-manrope rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-foreground outline-none hover:border-border focus:border-primary"
                placeholder="Category name"
              />
              {skillCategories.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(skillCategories.filter((_, i) => i !== ci))
                  }
                  className="text-xs text-muted-foreground hover:text-red-500"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={inputs[ci] || ""}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, [ci]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(ci);
                  }
                }}
                placeholder="Add skill..."
                className="font-manrope flex-1 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            {cat.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {cat.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 font-manrope text-[11px] text-foreground"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() =>
                        onChange(
                          skillCategories.map((c, i) =>
                            i === ci
                              ? {
                                  ...c,
                                  skills: c.skills.filter((sk) => sk !== s),
                                }
                              : c
                          )
                        )
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([...skillCategories, { name: "", skills: [] }])
          }
          className="self-start font-manrope text-xs text-primary transition-colors hover:text-primary/80"
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
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Experience
      </h2>
      <div className="flex flex-col gap-4">
        {internships.map((intern, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  value={intern.role}
                  onChange={(e) =>
                    onChange(
                      internships.map((x, idx) =>
                        idx === i ? { ...x, role: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Role"
                  className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground outline-none hover:border-border focus:border-primary"
                />
                <span className="text-muted-foreground">at</span>
                <input
                  value={intern.company}
                  onChange={(e) =>
                    onChange(
                      internships.map((x, idx) =>
                        idx === i ? { ...x, company: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Company"
                  className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-foreground outline-none hover:border-border focus:border-primary"
                />
              </div>
              {internships.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(internships.filter((_, idx) => idx !== i))
                  }
                  className="text-xs text-muted-foreground hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
            <BulletEditor
              bullets={intern.bullets || []}
              onChange={(bullets: Bullet[]) =>
                onChange(
                  internships.map((x, idx) =>
                    idx === i ? { ...x, bullets } : x
                  )
                )
              }
              placeholder="Describe your work..."
            />
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
          className="self-start font-manrope text-xs text-primary transition-colors hover:text-primary/80"
        >
          + Add internship
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
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Projects
      </h2>
      <div className="flex flex-col gap-4">
        {projects.map((proj, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <input
                value={proj.title}
                onChange={(e) =>
                  onChange(
                    projects.map((x, idx) =>
                      idx === i ? { ...x, title: e.target.value } : x
                    )
                  )
                }
                placeholder="Project title"
                className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground outline-none hover:border-border focus:border-primary"
              />
              {projects.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(projects.filter((_, idx) => idx !== i))
                  }
                  className="text-xs text-muted-foreground hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
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
          className="self-start font-manrope text-xs text-primary transition-colors hover:text-primary/80"
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
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Achievements
      </h2>
      <div className="flex flex-col gap-3">
        {achievements.map((ach, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-border/60 p-3">
            <div className="flex flex-1 flex-col gap-2">
              <input
                value={ach.title}
                onChange={(e) =>
                  onChange(
                    achievements.map((a, idx) =>
                      idx === i ? { ...a, title: e.target.value } : a
                    )
                  )
                }
                placeholder="Achievement title"
                className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground outline-none hover:border-border focus:border-primary"
              />
              <input
                value={ach.description || ""}
                onChange={(e) =>
                  onChange(
                    achievements.map((a, idx) =>
                      idx === i ? { ...a, description: e.target.value } : a
                    )
                  )
                }
                placeholder="Description"
                className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-foreground outline-none hover:border-border focus:border-primary"
              />
              <input
                value={ach.link || ""}
                onChange={(e) =>
                  onChange(
                    achievements.map((a, idx) =>
                      idx === i ? { ...a, link: e.target.value } : a
                    )
                  )
                }
                placeholder="Link (optional)"
                className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-muted-foreground outline-none hover:border-border focus:border-primary"
              />
            </div>
            {achievements.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChange(achievements.filter((_, idx) => idx !== i))
                }
                className="text-xs text-muted-foreground hover:text-red-500"
              >
                ×
              </button>
            )}
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
          className="self-start font-manrope text-xs text-primary transition-colors hover:text-primary/80"
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
      <h2 className="font-space-grotesk mb-3 text-sm font-semibold text-foreground">
        Hobbies & Interests
      </h2>
      <div className="flex flex-col gap-2">
        {hobbyItems.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={h.name}
              onChange={(e) =>
                onChange(
                  hobbyItems.map((x, idx) =>
                    idx === i ? { ...x, name: e.target.value } : x
                  )
                )
              }
              placeholder="Hobby name"
              className="font-manrope w-1/3 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            />
            <input
              value={h.description || ""}
              onChange={(e) =>
                onChange(
                  hobbyItems.map((x, idx) =>
                    idx === i ? { ...x, description: e.target.value } : x
                  )
                )
              }
              placeholder="Brief description (optional)"
              className="font-manrope flex-1 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => onChange(hobbyItems.filter((_, idx) => idx !== i))}
              className="text-xs text-muted-foreground hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([...hobbyItems, { name: "", description: "" }])
          }
          className="self-start font-manrope text-xs text-primary transition-colors hover:text-primary/80"
        >
          + Add hobby
        </button>
      </div>
    </div>
  );
}
