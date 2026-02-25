"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/store/resumeStore";
import { ThemeToggle } from "@/components/theme-toggle";

/* ─────────────────────────────────────────────
   Animation variants
   ───────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

/* ─────────────────────────────────────────────
   Template metadata
   ───────────────────────────────────────────── */
type TemplateType = "CLASSIC" | "MODERN" | "MINIMAL" | "ACADEMIC" | "TECHNICAL";

interface TemplateInfo {
  id: TemplateType;
  name: string;
  description: string;
  tags: string[];
  accent: string; // tailwind ring color for selection
}

const templates: TemplateInfo[] = [
  {
    id: "CLASSIC",
    name: "Classic",
    description:
      "Traditional single-column layout with clear section dividers. Universally accepted by ATS systems and recruiters.",
    tags: ["ATS-safe", "Traditional", "Single-column"],
    accent: "ring-blue-500/50",
  },
  {
    id: "MODERN",
    name: "Modern",
    description:
      "Clean two-tone header with a contemporary feel. Balanced whitespace, subtle color accents.",
    tags: ["Contemporary", "Two-tone", "Color accents"],
    accent: "ring-violet-500/50",
  },
  {
    id: "MINIMAL",
    name: "Minimal",
    description:
      "Stripped-down typography-first design. Maximum content density with elegant spacing.",
    tags: ["Typography-first", "Dense", "Elegant"],
    accent: "ring-zinc-400/50",
  },
  {
    id: "ACADEMIC",
    name: "Academic",
    description:
      "Emphasizes education, coursework, and research. Ideal for students with strong academic profiles.",
    tags: ["Education-first", "Research", "Coursework"],
    accent: "ring-emerald-500/50",
  },
  {
    id: "TECHNICAL",
    name: "Technical",
    description:
      "Highlights skills and projects prominently. Built for CS, IT, and engineering students.",
    tags: ["Skills-forward", "Projects", "Engineering"],
    accent: "ring-amber-500/50",
  },
];

/* ─────────────────────────────────────────────
   Mini preview renderer (uses store data)
   ───────────────────────────────────────────── */
function TemplateMiniPreview({
  template,
  data,
}: {
  template: TemplateType;
  data: {
    fullName: string;
    contactEmail: string;
    phone: string;
    skills: string[];
    summary: string;
  };
}) {
  const name = data.fullName || "Your Name";
  const email = data.contactEmail || "email@chitkara.edu.in";
  const skills = data.skills.length > 0 ? data.skills.slice(0, 6) : ["Skill 1", "Skill 2", "Skill 3"];
  const summary =
    data.summary ||
    "Your professional summary will appear here. Fill in the form to see a personalized preview.";

  const previewStyles: Record<TemplateType, React.ReactNode> = {
    CLASSIC: (
      <div className="flex h-full flex-col p-4 text-[6px] leading-[1.6]">
        <div className="border-b border-foreground/20 pb-2 text-center">
          <p className="text-[9px] font-bold tracking-wide">{name}</p>
          <p className="mt-0.5 text-foreground/50">{email}</p>
        </div>
        <div className="mt-2">
          <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-foreground/60">Summary</p>
          <p className="mt-0.5 text-foreground/70 line-clamp-2">{summary}</p>
        </div>
        <div className="mt-2">
          <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-foreground/60">Skills</p>
          <p className="mt-0.5 text-foreground/70">{skills.join(" · ")}</p>
        </div>
        <div className="mt-auto pt-2">
          <div className="h-1 w-full rounded-full bg-foreground/10" />
          <div className="mt-1 h-1 w-3/4 rounded-full bg-foreground/10" />
        </div>
      </div>
    ),
    MODERN: (
      <div className="flex h-full flex-col text-[6px] leading-[1.6]">
        <div className="bg-foreground/[0.06] px-4 py-3">
          <p className="text-[9px] font-bold tracking-wide">{name}</p>
          <p className="mt-0.5 text-foreground/50">{email}</p>
        </div>
        <div className="flex-1 p-4">
          <div className="mb-1.5 h-0.5 w-8 rounded-full bg-violet-500/40" />
          <p className="text-foreground/70 line-clamp-2">{summary}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded bg-foreground/[0.06] px-1 py-0.5 text-[5px]">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    MINIMAL: (
      <div className="flex h-full flex-col p-4 text-[6px] leading-[1.6]">
        <p className="text-[10px] font-light tracking-widest">{name}</p>
        <p className="mt-0.5 text-foreground/40">{email}</p>
        <div className="mt-3 border-l border-foreground/15 pl-2">
          <p className="text-foreground/70 line-clamp-2">{summary}</p>
        </div>
        <div className="mt-auto flex gap-1">
          {skills.slice(0, 3).map((s) => (
            <span key={s} className="text-[5px] text-foreground/40">
              {s}
            </span>
          ))}
        </div>
      </div>
    ),
    ACADEMIC: (
      <div className="flex h-full flex-col p-4 text-[6px] leading-[1.6]">
        <div className="text-center">
          <p className="text-[9px] font-bold">{name}</p>
          <p className="mt-0.5 text-foreground/50">{email}</p>
        </div>
        <div className="mt-2.5">
          <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-emerald-500/70">Education</p>
          <div className="mt-0.5 h-1 w-full rounded-full bg-foreground/[0.06]" />
          <div className="mt-0.5 h-1 w-4/5 rounded-full bg-foreground/[0.06]" />
        </div>
        <div className="mt-2">
          <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-emerald-500/70">Coursework</p>
          <div className="mt-0.5 h-1 w-full rounded-full bg-foreground/[0.06]" />
        </div>
        <div className="mt-auto pt-2">
          <p className="text-foreground/40">{skills.slice(0, 3).join(" · ")}</p>
        </div>
      </div>
    ),
    TECHNICAL: (
      <div className="flex h-full flex-col text-[6px] leading-[1.6]">
        <div className="border-b border-amber-500/20 px-4 py-2.5">
          <p className="text-[9px] font-bold tracking-wide">{name}</p>
        </div>
        <div className="flex flex-1">
          <div className="w-1/3 border-r border-foreground/10 p-2">
            <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-amber-500/70">Skills</p>
            {skills.slice(0, 5).map((s) => (
              <p key={s} className="mt-0.5 text-foreground/60">
                {s}
              </p>
            ))}
          </div>
          <div className="flex-1 p-2">
            <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-foreground/60">Projects</p>
            <div className="mt-0.5 h-1 w-full rounded-full bg-foreground/[0.06]" />
            <div className="mt-0.5 h-1 w-4/5 rounded-full bg-foreground/[0.06]" />
            <div className="mt-0.5 h-1 w-3/5 rounded-full bg-foreground/[0.06]" />
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="aspect-[8.5/11] w-full overflow-hidden rounded-xl border border-border/60 bg-background/80 shadow-sm transition-shadow group-hover:shadow-md">
      {previewStyles[template]}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page component
   ───────────────────────────────────────────── */
export default function TemplatesPage() {
  const router = useRouter();
  const {
    resumeId,
    step1,
    step3,
    step5,
    selectedTemplate,
    setTemplate,
  } = useResumeStore();

  const [selected, setSelected] = useState<TemplateType>(
    (selectedTemplate as TemplateType) || "CLASSIC"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync from store on mount
  useEffect(() => {
    if (selectedTemplate) {
      setSelected(selectedTemplate as TemplateType);
    }
  }, [selectedTemplate]);

  const previewData = {
    fullName: step1?.fullName || "",
    contactEmail: step1?.contactEmail || "",
    phone: step1?.phone || "",
    skills: step3?.skills || [],
    summary: step5?.summary || "",
  };

  const handleSelect = (id: TemplateType) => {
    setSelected(id);
    setSaveError(null);
  };

  const handleContinue = async () => {
    if (!resumeId) {
      setSaveError("No resume found. Please go back and fill the form.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Save template selection to backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/resume/${resumeId}/template`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ template: selected }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to save template");
      }

      // Update local store
      setTemplate(selected);
      router.push("/preview");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectedInfo = templates.find((t) => t.id === selected)!;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeToggle />

      {/* Background layers */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--primary)/.06,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)/.18_1px,transparent_1px),linear-gradient(to_bottom,var(--border)/.18_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_30%,black_20%,transparent_100%)]"
        aria-hidden
      />

      <main className="relative mx-auto max-w-5xl px-5 pb-24 pt-16 sm:px-8 sm:pt-20">
        <motion.div variants={container} initial="hidden" animate="show">
          {/* ─── Header ─── */}
          <motion.div variants={item} className="mb-10 text-center">
            <Link
              href="/"
              className="font-akrobat text-xl font-bold tracking-wider text-foreground/70 transition-opacity hover:opacity-80"
            >
              ChitkaraCV
            </Link>
            <p className="font-dm-mono mt-4 text-[11px] uppercase tracking-[0.2em] text-primary/70">
              Step 6 of 7
            </p>
            <h1 className="font-instrument-serif mt-2 text-3xl tracking-wide text-foreground sm:text-4xl">
              Choose your template
            </h1>
            <p className="font-manrope mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Every template is ATS-compliant and print-ready. Pick the one that
              matches your style — you can always change it later.
            </p>
          </motion.div>

          {/* ─── Template grid ─── */}
          <motion.div variants={item}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tmpl) => {
                const isSelected = selected === tmpl.id;
                return (
                  <motion.button
                    key={tmpl.id}
                    onClick={() => handleSelect(tmpl.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    className={`group relative rounded-2xl border p-4 text-left transition-all backdrop-blur-sm ${
                      isSelected
                        ? `border-foreground/30 bg-card/70 ring-2 ${tmpl.accent}`
                        : "border-border/60 bg-card/40 hover:border-border/90 hover:bg-card/60"
                    }`}
                  >
                    {/* Selection indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-foreground"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-background"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mini preview */}
                    <TemplateMiniPreview
                      template={tmpl.id}
                      data={previewData}
                    />

                    {/* Info */}
                    <div className="mt-3">
                      <h3 className="font-space-grotesk text-sm font-semibold uppercase tracking-wider text-foreground">
                        {tmpl.name}
                      </h3>
                      <p className="font-manrope mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {tmpl.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {tmpl.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 font-dm-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ─── Selected template detail card ─── */}
          <motion.div variants={item} className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-primary/15 bg-primary/[0.03] px-5 py-4 sm:px-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                      Selected: {selectedInfo.name}
                    </p>
                    <p className="font-manrope mt-1 text-sm leading-relaxed text-muted-foreground">
                      {selectedInfo.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {selectedInfo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="hidden rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 font-dm-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline-block"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ─── Error ─── */}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-center"
            >
              <p className="font-manrope text-sm text-red-400">{saveError}</p>
            </motion.div>
          )}

          {/* ─── Navigation ─── */}
          <motion.div
            variants={item}
            className="mt-8 flex items-center justify-between border-t border-border/40 pt-6"
          >
            <Link
              href="/form/summary"
              className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to form
            </Link>
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                  Saving…
                </span>
              ) : (
                "Preview resume →"
              )}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}