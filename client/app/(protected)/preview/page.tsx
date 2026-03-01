"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/store/resumeStore";
import type { TemplateType } from "@/store/resumeStore";
import { ThemeToggle } from "@/components/theme-toggle";

const TEMPLATE_OPTIONS: { value: TemplateType; label: string }[] = [
  { value: "CLASSIC", label: "Classic" },
  { value: "MODERN", label: "Modern" },
  { value: "MINIMAL", label: "Minimal" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "TECHNICAL", label: "Technical" },
];

/* ─────────────────────────────────────────────
   Animation variants
   ───────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface AtsResult {
  total: number;
  max: number;
  issues: string[];
  suggestions: string[];
}

/* ─────────────────────────────────────────────
   ATS Score Ring Component
   ───────────────────────────────────────────── */
function AtsScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let color = "text-red-400";
  let bg = "text-red-400/15";
  let label = "Needs work";
  if (pct >= 80) {
    color = "text-emerald-400";
    bg = "text-emerald-400/15";
    label = "Excellent";
  } else if (pct >= 60) {
    color = "text-amber-400";
    bg = "text-amber-400/15";
    label = "Good";
  } else if (pct >= 40) {
    color = "text-orange-400";
    bg = "text-orange-400/15";
    label = "Fair";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="5"
            className={`stroke-current ${bg}`}
          />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            className={`stroke-current ${color}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-space-grotesk text-xl font-bold ${color}`}>
            {pct}
          </span>
        </div>
      </div>
      <p className={`font-space-grotesk text-xs font-semibold uppercase tracking-wider ${color}`}>
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Preview Page
   ───────────────────────────────────────────── */
export default function PreviewPage() {
  const router = useRouter();
  const { resumeId, selectedTemplate, setTemplate, loadResume } = useResumeStore();

  // States
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [isCheckingAts, setIsCheckingAts] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [showAtsPanel, setShowAtsPanel] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  /* ─── Fetch HTML preview ─── */
  const fetchPreview = useCallback(async () => {
    if (!resumeId) return;

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const res = await fetch(
        `${apiBase}/resume/${resumeId}/preview`,
        { credentials: "include" }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to load preview");
      }

      const html = await res.text();
      setPreviewHtml(html);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to load preview"
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }, [resumeId, apiBase]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Keep store in sync with API when viewing preview (e.g. after refresh)
  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId).catch(() => {});
    }
  }, [resumeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTemplateChange = async (template: TemplateType) => {
    if (!resumeId) return;
    setIsUpdatingTemplate(true);
    try {
      await setTemplate(template);
      await fetchPreview();
    } catch {
      setPreviewError("Failed to update template");
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  /* ─── Write HTML into iframe ─── */
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  /* ─── ATS Check ─── */
  const handleAtsCheck = async () => {
    if (!resumeId) return;

    setIsCheckingAts(true);
    setAtsError(null);

    try {
      const res = await fetch(`${apiBase}/ai/ats-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "ATS check failed");
      }

      const data = await res.json();
      setAtsResult(data.data);
      setShowAtsPanel(true);
    } catch (err) {
      setAtsError(
        err instanceof Error ? err.message : "ATS check failed"
      );
    } finally {
      setIsCheckingAts(false);
    }
  };

  /* ─── PDF Download ─── */
  const handleDownload = async () => {
    if (!resumeId) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const res = await fetch(
        `${apiBase}/resume/${resumeId}/download`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Download failed");
      }

      // Response is a PDF blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ChitkaraCV-Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Download failed"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  /* ─── Redirect if no resume ─── */
  useEffect(() => {
    if (!resumeId) {
      // Small delay for store hydration
      const timeout = setTimeout(() => {
        if (!resumeId) {
          router.push("/form/personal");
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [resumeId, router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeToggle />

      {/* Background layers */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--primary)/.06,transparent_70%)]"
        aria-hidden
      />

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pt-20">
        <motion.div variants={container} initial="hidden" animate="show">
          {/* ─── Header ─── */}
          <motion.div variants={item} className="mb-8 text-center">
            <Link
              href="/"
              className="font-akrobat text-xl font-bold tracking-wider text-foreground/70 transition-opacity hover:opacity-80"
            >
              ChitkaraCV
            </Link>
            <p className="font-dm-mono mt-4 text-[11px] uppercase tracking-[0.2em] text-primary/70">
              Step 7 of 7
            </p>
            <h1 className="font-instrument-serif mt-2 text-3xl tracking-wide text-foreground sm:text-4xl">
              Preview & Download
            </h1>
            <p className="font-manrope mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Review your resume below. Run an ATS check to find improvements,
              then download the final PDF.
            </p>
          </motion.div>

          {/* ─── Action bar ─── */}
          <motion.div variants={item} className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-5 py-3.5 backdrop-blur-sm">
              {/* Template dropdown (persists to API and refetches preview) */}
              <div className="flex items-center gap-3">
                <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Template
                </span>
                <select
                  value={selectedTemplate || "CLASSIC"}
                  onChange={(e) =>
                    handleTemplateChange(e.target.value as TemplateType)
                  }
                  disabled={isUpdatingTemplate || isLoadingPreview}
                  className="font-manrope rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {TEMPLATE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {isUpdatingTemplate && (
                  <span className="font-manrope text-[10px] text-muted-foreground">
                    Updating…
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/form/summary"
                  className="font-manrope rounded-lg bg-foreground/[0.06] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10"
                >
                  Edit form
                </Link>
                <Link
                  href="/editor"
                  className="font-manrope rounded-lg bg-foreground/[0.06] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10"
                >
                  Edit in editor
                </Link>

                <button
                  onClick={handleAtsCheck}
                  disabled={isCheckingAts}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/[0.06] px-3 py-2 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  {isCheckingAts ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border border-foreground/30 border-t-foreground" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      ATS Check
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading || isLoadingPreview}
                  className="font-space-grotesk inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2 text-xs font-medium text-background shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ─── Error messages ─── */}
          {(downloadError || atsError) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-center"
            >
              <p className="font-manrope text-sm text-red-400">
                {downloadError || atsError}
              </p>
            </motion.div>
          )}

          {/* ─── Main content area ─── */}
          <motion.div variants={item}>
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Resume preview */}
              <div className="flex-1">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-lg">
                  {isLoadingPreview ? (
                    <div className="flex aspect-[8.5/11] items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                        <p className="font-manrope text-sm text-zinc-400">
                          Loading preview…
                        </p>
                      </div>
                    </div>
                  ) : previewError ? (
                    <div className="flex aspect-[8.5/11] items-center justify-center p-8">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-red-500"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </div>
                        <p className="font-manrope text-sm text-zinc-600">
                          {previewError}
                        </p>
                        <button
                          onClick={fetchPreview}
                          className="mt-3 font-manrope text-sm font-medium text-zinc-800 underline underline-offset-4 hover:no-underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      ref={iframeRef}
                      title="Resume Preview"
                      className="aspect-[8.5/11] w-full border-0"
                      sandbox="allow-same-origin"
                    />
                  )}
                </div>

                {/* Refresh preview hint */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={fetchPreview}
                    className="inline-flex items-center gap-1.5 font-manrope text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Refresh preview
                  </button>
                </div>
              </div>

              {/* ─── ATS Results Panel ─── */}
              <AnimatePresence>
                {showAtsPanel && atsResult && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "auto" }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full lg:w-80"
                  >
                    <div className="sticky top-8 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
                      {/* Close */}
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                          ATS Analysis
                        </h3>
                        <button
                          onClick={() => setShowAtsPanel(false)}
                          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>

                      {/* Score */}
                      <AtsScoreRing score={atsResult.total} max={atsResult.max} />

                      <div className="mt-2 text-center">
                        <p className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {Math.round(atsResult.total)} / {atsResult.max} points
                        </p>
                      </div>

                      {/* Issues */}
                      {atsResult.issues.length > 0 && (
                        <div className="mt-5">
                          <p className="font-space-grotesk text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400">
                            Issues
                          </p>
                          <ul className="mt-2 space-y-2">
                            {atsResult.issues.map((issue, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 font-manrope text-xs leading-relaxed text-muted-foreground"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="mt-0.5 shrink-0 text-red-400"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {atsResult.suggestions.length > 0 && (
                        <div className="mt-5">
                          <p className="font-space-grotesk text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-400">
                            Suggestions
                          </p>
                          <ul className="mt-2 space-y-2">
                            {atsResult.suggestions.map((sug, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 font-manrope text-xs leading-relaxed text-muted-foreground"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="mt-0.5 shrink-0 text-amber-400"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                {sug}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Re-run */}
                      <button
                        onClick={handleAtsCheck}
                        disabled={isCheckingAts}
                        className="mt-5 w-full rounded-lg bg-foreground/[0.06] py-2.5 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
                      >
                        {isCheckingAts ? "Re-checking…" : "Re-run ATS check"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── Info card ─── */}
          <motion.div variants={item} className="mt-8">
            <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] px-5 py-4">
              <p className="font-manrope text-center text-xs leading-relaxed text-muted-foreground">
                <span className="font-space-grotesk font-semibold text-foreground">
                  Tip:
                </span>{" "}
                Run the ATS check before downloading. It catches missing fields,
                weak descriptions, and formatting issues that automated systems
                flag. A score above 80 means you&apos;re in great shape.
              </p>
            </div>
          </motion.div>

          {/* ─── Navigation ─── */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-6"
          >
            <div className="flex items-center gap-3">
              <Link
                href="/form/summary"
                className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Edit form
              </Link>
              <Link
                href="/editor"
                className="font-manrope text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Edit in editor
              </Link>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading || isLoadingPreview}
              className="font-space-grotesk inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                  Generating PDF…
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}