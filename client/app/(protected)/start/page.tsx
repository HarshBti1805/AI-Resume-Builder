"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useResumeStore } from "@/store/resumeStore";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function StartPage() {
  const router = useRouter();
  useAuthStore();
  const { prefillFromParsed, initResume, saveAllSteps } = useResumeStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScratch = async () => {
    try {
      await initResume();
      router.push("/templates/select");
    } catch {
      setError("Failed to initialise resume. Try again.");
    }
  };

  const handleUpload = async () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch(`${API_BASE}/upload/resume-parse`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      if (data.success && data.data?.parsed) {
        await initResume();
        prefillFromParsed(data.data.parsed);
        try {
          await saveAllSteps();
          router.push("/templates/select");
        } catch (saveErr) {
          console.error("Save parsed data failed", saveErr);
          setError(
            "Data was parsed but saving failed. Try again or start from scratch.",
          );
        }
      } else {
        throw new Error("Failed to parse resume");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* ─── Navbar: aligned with content ─── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-none bg-transparent px-4">
        <Link
          href="/"
          className="font-manrope text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <UserProfileButton inline />
          <ThemeToggle className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-muted" />
        </div>
      </header>

      {/* ─── Middle section ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <motion.div variants={item} className="mb-10 text-center">
            <p className="font-dm-mono text-[11px] uppercase tracking-[0.25em] text-primary/60">
              AI Resume Builder
            </p>
            <h1 className="font-instrument-serif mt-2 text-3xl tracking-wide text-foreground sm:text-4xl">
              How would you like to start?
            </h1>
            <p className="font-manrope mt-3 text-sm text-muted-foreground">
              Upload an existing resume to pre-fill your data, or start fresh.
            </p>
          </motion.div>

          {/* Cards — side-by-side grid */}
          <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
            {/* Upload card */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/60 p-7 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* Top row: icon + badge */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/15">
                  {uploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  ) : (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                </div>
                <span className="font-dm-mono rounded-full border border-primary/20 bg-primary/[0.08] px-2.5 py-1 text-[9px] uppercase tracking-widest text-primary/80">
                  Faster
                </span>
              </div>

              {/* Body */}
              <div className="flex-1">
                <h3 className="font-space-grotesk text-base font-semibold text-foreground">
                  {uploading ? "Parsing…" : "Upload Resume"}
                </h3>
                <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
                  PDF or DOCX. AI extracts your data automatically so you skip
                  the manual entry.
                </p>
              </div>

              {/* Hover CTA */}
              <div className="mt-6 flex items-center gap-1.5 font-manrope text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Choose file
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Scratch card */}
            <button
              type="button"
              onClick={handleScratch}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/60 p-7 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg"
            >
              {/* Top row: icon + badge */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/[0.06] transition-colors duration-200 group-hover:bg-foreground/10">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground/60"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                </div>
                <span className="font-dm-mono rounded-full border border-border/50 bg-muted/60 px-2.5 py-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                  Manual
                </span>
              </div>

              {/* Body */}
              <div className="flex-1">
                <h3 className="font-space-grotesk text-base font-semibold text-foreground">
                  Start from Scratch
                </h3>
                <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
                  Fill in each section step by step with AI help along the way.
                </p>
              </div>

              {/* Hover CTA */}
              <div className="mt-6 flex items-center gap-1.5 font-manrope text-xs font-medium text-foreground/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Get started
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-center dark:border-red-900/30 dark:bg-red-950/20"
            >
              <p className="font-manrope text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            </motion.div>
          )}
        </motion.div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
