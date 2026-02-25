"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";

const steps = [
  { id: 1, label: "Personal", href: "/form/personal" },
  { id: 2, label: "Academic", href: "/form/academic" },
  { id: 3, label: "Skills & Projects", href: "/form/skills" },
  { id: 4, label: "Experience", href: "/form/experience" },
  { id: 5, label: "Summary", href: "/form/summary" },
];

export default function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const {
    resumeId,
    initResume,
    loadResume,
    isSaving,
    lastSaved,
    saveError,
    setCurrentStep,
  } = useResumeStore();
  const [initDone, setInitDone] = useState(false);

  // Initialize or load resume once persist has rehydrated
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Brief delay so Zustand persist can rehydrate from localStorage
      await new Promise((r) => setTimeout(r, 50));
      const currentResumeId = useResumeStore.getState().resumeId;

      if (currentResumeId) {
        try {
          await loadResume(currentResumeId);
        } catch {
          try {
            await initResume();
          } catch {
            // Auth might have expired
          }
        }
      } else {
        try {
          await initResume();
        } catch {
          // Auth might have expired
        }
      }
      if (!cancelled) setInitDone(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.href));
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Keep store in sync with current step
  useEffect(() => {
    setCurrentStep(currentStep + 1);
  }, [currentStep, setCurrentStep]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ThemeToggle />

      {/* Subtle background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--primary)/.06,transparent_70%)]"
        aria-hidden
      />

      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="font-akrobat text-xl font-bold tracking-wider text-foreground transition-opacity hover:opacity-80 sm:text-2xl"
          >
            ChitkaraCV
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden font-dm-mono text-[11px] uppercase tracking-widest text-muted-foreground/60 sm:block">
              Step {currentStep + 1} of {steps.length}
            </span>
            {isSaving && (
              <span className="font-manrope text-xs text-muted-foreground">
                Saving…
              </span>
            )}
            {lastSaved && !isSaving && (
              <span className="font-manrope text-xs text-muted-foreground/70">
                Saved
              </span>
            )}
            {saveError && !isSaving && (
              <span className="font-manrope text-xs text-destructive">
                {saveError}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-border/30">
          <motion.div
            className="h-full bg-foreground/70"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </header>

      {/* ─── Content area ─── */}
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* ─── Sidebar stepper (desktop) ─── */}
          <nav className="hidden lg:block lg:w-52 lg:shrink-0">
            <div className="sticky top-28">
              <ul className="flex flex-col gap-1">
                {steps.map((step, i) => {
                  const isActive = i === currentStep;
                  const isCompleted = i < currentStep;

                  return (
                    <li key={step.id}>
                      <Link
                        href={step.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                          isActive
                            ? "bg-foreground/[0.06]"
                            : "hover:bg-foreground/[0.03]"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-dm-mono text-[11px] font-medium transition-all ${
                            isActive
                              ? "bg-foreground text-background"
                              : isCompleted
                                ? "bg-foreground/15 text-foreground"
                                : "bg-muted/60 text-muted-foreground/60"
                          }`}
                        >
                          {isCompleted ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              className="text-foreground"
                            >
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            step.id
                          )}
                        </span>
                        <span
                          className={`font-manrope text-sm transition-colors ${
                            isActive
                              ? "font-medium text-foreground"
                              : isCompleted
                                ? "text-foreground/70"
                                : "text-muted-foreground/60"
                          }`}
                        >
                          {step.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* ─── Mobile stepper ─── */}
          <nav className="lg:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {steps.map((step, i) => {
                const isActive = i === currentStep;
                const isCompleted = i < currentStep;

                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-foreground text-background"
                        : isCompleted
                          ? "bg-foreground/10 text-foreground"
                          : "bg-muted/50 text-muted-foreground/60"
                    }`}
                  >
                    <span className="font-dm-mono">{step.id}</span>
                    <span className="font-manrope">{step.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ─── Form content ─── */}
          <main className="min-w-0 flex-1">
            {initDone ? (
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {children}
              </motion.div>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}