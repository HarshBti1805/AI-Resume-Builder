"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { ThemeToggle } from "@/components/theme-toggle";

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
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function StartPage() {
  const router = useRouter();
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
          setError("Data was parsed but saving failed. Try again or start from scratch.");
        }
      } else {
        throw new Error("Failed to parse resume");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Try again."
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-2xl"
      >
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

        <motion.div
          variants={item}
          className="grid gap-5 sm:grid-cols-2"
        >
          {/* Upload card */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="group relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border/70 bg-card/40 p-8 text-center backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/[0.02] disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex h-14 w-14 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/[0.06] transition-colors group-hover:bg-primary/10">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground/60 transition-colors group-hover:text-primary"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="font-space-grotesk text-sm font-semibold text-foreground">
                {uploading ? "Parsing..." : "Upload Existing Resume"}
              </h3>
              <p className="font-manrope mt-1 text-xs text-muted-foreground">
                PDF or DOCX. AI extracts your data automatically.
              </p>
            </div>
          </button>

          {/* Scratch card */}
          <button
            type="button"
            onClick={handleScratch}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border/70 bg-card/40 p-8 text-center backdrop-blur-sm transition-all hover:border-foreground/30 hover:bg-foreground/[0.02]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/[0.06] transition-colors group-hover:bg-foreground/10">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
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
            <div>
              <h3 className="font-space-grotesk text-sm font-semibold text-foreground">
                Start from Scratch
              </h3>
              <p className="font-manrope mt-1 text-xs text-muted-foreground">
                Fill in each section step by step with AI help.
              </p>
            </div>
          </button>
        </motion.div>

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
  );
}
