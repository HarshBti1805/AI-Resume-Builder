"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/store/resumeStore";
import { ThemeToggle } from "@/components/theme-toggle";

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

type TemplateType = "CLASSIC" | "MODERN" | "MINIMAL" | "ACADEMIC" | "TECHNICAL";

interface TemplateInfo {
  id: TemplateType;
  name: string;
  description: string;
  tags: string[];
  accent: string;
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

function TemplateMiniPreview({ template }: { template: TemplateType }) {
  const previewStyles: Record<TemplateType, React.ReactNode> = {
    CLASSIC: (
      <div className="flex h-full flex-col p-4 text-[6px] leading-[1.6]">
        <div className="border-b border-foreground/20 pb-2 text-center">
          <p className="text-[9px] font-bold tracking-wide">Your Name</p>
          <p className="mt-0.5 text-foreground/50">email@example.com</p>
        </div>
        <div className="mt-2">
          <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-foreground/60">Summary</p>
          <p className="mt-0.5 text-foreground/70 line-clamp-2">Professional summary will appear here with your key skills and experience.</p>
        </div>
        <div className="mt-2">
          <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-foreground/60">Skills</p>
          <p className="mt-0.5 text-foreground/70">React · Node.js · TypeScript</p>
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
          <p className="text-[9px] font-bold tracking-wide">Your Name</p>
          <p className="mt-0.5 text-foreground/50">email@example.com</p>
        </div>
        <div className="flex-1 p-4">
          <div className="mb-1.5 h-0.5 w-8 rounded-full bg-violet-500/40" />
          <p className="text-foreground/70 line-clamp-2">Professional summary with key highlights.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {["React", "Node.js", "TypeScript", "Docker"].map((s) => (
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
        <p className="text-[10px] font-light tracking-widest">Your Name</p>
        <p className="mt-0.5 text-foreground/40">email@example.com</p>
        <div className="mt-3 border-l border-foreground/15 pl-2">
          <p className="text-foreground/70 line-clamp-2">Professional summary with key highlights and experience.</p>
        </div>
        <div className="mt-auto flex gap-1">
          {["React", "Node.js", "TypeScript"].map((s) => (
            <span key={s} className="text-[5px] text-foreground/40">{s}</span>
          ))}
        </div>
      </div>
    ),
    ACADEMIC: (
      <div className="flex h-full flex-col p-4 text-[6px] leading-[1.6]">
        <div className="text-center">
          <p className="text-[9px] font-bold">Your Name</p>
          <p className="mt-0.5 text-foreground/50">email@example.com</p>
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
          <p className="text-foreground/40">React · Node.js · TypeScript</p>
        </div>
      </div>
    ),
    TECHNICAL: (
      <div className="flex h-full flex-col text-[6px] leading-[1.6]">
        <div className="border-b border-amber-500/20 px-4 py-2.5">
          <p className="text-[9px] font-bold tracking-wide">Your Name</p>
        </div>
        <div className="flex flex-1">
          <div className="w-1/3 border-r border-foreground/10 p-2">
            <p className="text-[5px] font-bold uppercase tracking-[0.15em] text-amber-500/70">Skills</p>
            {["React", "Node.js", "TypeScript", "Docker", "AWS"].map((s) => (
              <p key={s} className="mt-0.5 text-foreground/60">{s}</p>
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

export default function TemplateSelectPage() {
  const router = useRouter();
  const {
    resumeId,
    initResume,
    loadResume,
    selectedTemplate,
    setTemplate,
  } = useResumeStore();
  const [selected, setSelected] = useState<TemplateType>(
    (selectedTemplate as TemplateType) || "CLASSIC"
  );
  const [isReady, setIsReady] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  // Ensure we have a resume so we can persist the selected template
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const currentResumeId = useResumeStore.getState().resumeId;
      if (currentResumeId) {
        try {
          await loadResume(currentResumeId);
        } catch {
          try {
            await initResume();
          } catch {
            // auth / network
          }
        }
      } else {
        try {
          await initResume();
        } catch {
          // auth / network
        }
      }
      if (!cancelled) {
        const template = useResumeStore.getState().selectedTemplate as TemplateType | null;
        setSelected(template || "CLASSIC");
        setIsReady(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [initResume, loadResume]);

  const handleSelect = (id: TemplateType) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!useResumeStore.getState().resumeId) return;
    setIsContinuing(true);
    try {
      await setTemplate(selected);
      router.push("/form/personal");
    } catch {
      // show error or keep user on page
    } finally {
      setIsContinuing(false);
    }
  };

  const selectedInfo = templates.find((t) => t.id === selected)!;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeToggle />

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
          <motion.div variants={item} className="mb-10 text-center">
            <Link
              href="/"
              className="font-akrobat text-xl font-bold tracking-wider text-foreground/70 transition-opacity hover:opacity-80"
            >
              ChitkaraCV
            </Link>
            <p className="font-dm-mono mt-4 text-[11px] uppercase tracking-[0.2em] text-primary/70">
              Getting started
            </p>
            <h1 className="font-instrument-serif mt-2 text-3xl tracking-wide text-foreground sm:text-4xl">
              Choose your template
            </h1>
            <p className="font-manrope mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Pick a starting template. Every template is ATS-compliant and
              print-ready. You can always switch it later while editing.
            </p>
          </motion.div>

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

                    <TemplateMiniPreview template={tmpl.id} />

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

          <motion.div
            variants={item}
            className="mt-8 flex items-center justify-end border-t border-border/40 pt-6"
          >
            <button
              onClick={handleContinue}
              disabled={!isReady || isContinuing}
              className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isContinuing ? "Saving…" : "Continue to form →"}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
