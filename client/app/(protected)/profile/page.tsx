"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeSummary } from "@/store/resumeStore";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";

const TEMPLATE_LABELS: Record<string, string> = {
  CLASSIC: "Classic",
  MODERN: "Modern",
  MINIMAL: "Minimal",
  ACADEMIC: "Academic",
  TECHNICAL: "Technical",
  COMPACT: "Compact",
  ELEGANT: "Elegant",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    reset,
    loadResume,
    listResumes,
    duplicateResume,
    renameResume,
    removeResume,
    setShare,
  } = useResumeStore();

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openShareId, setOpenShareId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await listResumes();
      setResumes(list);
    } catch {
      setError("Could not load your resumes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [listResumes]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleNew = () => {
    reset();
    router.push("/start");
  };

  const handleOpen = async (id: string) => {
    setBusyId(id);
    try {
      await loadResume(id);
      router.push("/preview");
    } catch {
      setError("Failed to open resume.");
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    try {
      await duplicateResume(id);
      await refresh();
    } catch {
      setError("Failed to duplicate resume.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this resume permanently? This cannot be undone."))
      return;
    setBusyId(id);
    try {
      await removeResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete resume.");
    } finally {
      setBusyId(null);
    }
  };

  const startRename = (r: ResumeSummary) => {
    setEditingId(r.id);
    setEditTitle(r.title ?? "Untitled Resume");
  };

  const commitRename = async (id: string) => {
    const title = editTitle.trim() || "Untitled Resume";
    setEditingId(null);
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)));
    try {
      await renameResume(id, title);
    } catch {
      setError("Failed to rename resume.");
      refresh();
    }
  };

  const toggleShare = async (r: ResumeSummary) => {
    setBusyId(r.id);
    try {
      const next = await setShare(r.id, !r.isPublic);
      setResumes((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? { ...x, isPublic: next.isPublic, shareId: next.shareId }
            : x,
        ),
      );
      setOpenShareId(next.isPublic ? r.id : null);
    } catch {
      setError("Failed to update sharing.");
    } finally {
      setBusyId(null);
    }
  };

  const shareUrl = (shareId: string | null) =>
    shareId
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${shareId}`
      : "";

  const copyShare = async (r: ResumeSummary) => {
    const url = shareUrl(r.shareId);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-none bg-transparent px-4">
        <Link
          href="/start"
          className="font-manrope text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← New resume
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <UserProfileButton inline />
          <ThemeToggle className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-muted" />
        </div>
      </header>

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--primary)/.06,transparent_70%)]"
        aria-hidden
      />

      <main className="relative mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pt-12">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Your library
              </p>
              <h1 className="font-instrument-serif mt-2 text-3xl tracking-wide text-foreground sm:text-4xl">
                My resumes
              </h1>
              <p className="font-manrope mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Keep multiple versions — one for SDE roles, one for Data, and
                more. Duplicate a resume to spin off a new variant.
              </p>
            </div>
            <button
              onClick={handleNew}
              className="font-space-grotesk inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-medium text-background shadow-md transition-all hover:opacity-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New resume
            </button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-center"
            >
              <p className="font-manrope text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
              <p className="font-manrope text-sm text-muted-foreground">
                Loading your resumes…
              </p>
            </div>
          ) : resumes.length === 0 ? (
            <motion.div
              variants={item}
              className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center"
            >
              <p className="font-space-grotesk text-base font-semibold text-foreground">
                No resumes yet
              </p>
              <p className="font-manrope mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Create your first resume to get started. You can always come
                back here to manage all your versions.
              </p>
              <button
                onClick={handleNew}
                className="font-space-grotesk mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-medium text-background shadow-md transition-all hover:opacity-90"
              >
                Create a resume
              </button>
            </motion.div>
          ) : (
            <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:border-border"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingId === r.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => commitRename(r.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(r.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="font-space-grotesk w-full rounded-lg border border-border bg-muted/40 px-2 py-1 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <button
                          onClick={() => startRename(r)}
                          title="Rename"
                          className="font-space-grotesk truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {r.title || "Untitled Resume"}
                        </button>
                      )}
                      <p className="font-manrope mt-1 truncate text-xs text-muted-foreground">
                        {r.fullName || "No name yet"}
                      </p>
                    </div>
                    <span
                      className={`font-dm-mono shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                        r.status === "COMPLETED"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-foreground/[0.07] text-muted-foreground"
                      }`}
                    >
                      {r.status === "COMPLETED" ? "Complete" : "Draft"}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-manrope text-[11px] text-muted-foreground">
                    <span>
                      {r.selectedTemplate
                        ? TEMPLATE_LABELS[r.selectedTemplate] ?? r.selectedTemplate
                        : "No template"}
                    </span>
                    {typeof r.atsScore === "number" && (
                      <span>ATS {r.atsScore}/100</span>
                    )}
                    <span>Edited {formatDate(r.updatedAt)}</span>
                    {r.isPublic && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Shared
                      </span>
                    )}
                  </div>

                  {/* Share panel */}
                  <AnimatePresence>
                    {openShareId === r.id && r.isPublic && r.shareId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-2">
                          <input
                            readOnly
                            value={shareUrl(r.shareId)}
                            className="font-dm-mono min-w-0 flex-1 truncate bg-transparent px-1 text-[11px] text-foreground outline-none"
                          />
                          <button
                            onClick={() => copyShare(r)}
                            className="font-manrope shrink-0 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-all hover:opacity-90"
                          >
                            {copiedId === r.id ? "Copied!" : "Copy"}
                          </button>
                          <a
                            href={shareUrl(r.shareId)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-manrope shrink-0 rounded-md bg-foreground/[0.08] px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-foreground/15"
                          >
                            Open
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpen(r.id)}
                      disabled={busyId === r.id}
                      className="font-space-grotesk inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-xs font-medium text-background shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {busyId === r.id ? "Opening…" : "Open"}
                    </button>
                    <button
                      onClick={() => handleDuplicate(r.id)}
                      disabled={busyId === r.id}
                      className="font-manrope rounded-lg bg-foreground/[0.06] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() =>
                        r.isPublic ? setOpenShareId(openShareId === r.id ? null : r.id) : toggleShare(r)
                      }
                      disabled={busyId === r.id}
                      className="font-manrope rounded-lg bg-foreground/[0.06] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
                    >
                      {r.isPublic ? "Share link" : "Share"}
                    </button>
                    {r.isPublic && (
                      <button
                        onClick={() => toggleShare(r)}
                        disabled={busyId === r.id}
                        className="font-manrope rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        title="Stop sharing"
                      >
                        Unshare
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={busyId === r.id}
                      className="font-manrope ml-auto rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-red-400 disabled:opacity-50"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
