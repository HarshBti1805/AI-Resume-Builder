"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { LivePreview } from "@/components/preview/LivePreview";
import { TemplateSwitch } from "@/components/form/TemplateSwitch";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";

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
  const router = useRouter();
  const {
    resumeId,
    loadResume,
    isSaving,
    lastSaved,
    saveError,
    setCurrentStep,
  } = useResumeStore();
  const [initDone, setInitDone] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 50));
      // If a save is in-flight (e.g. autosave from Academic page),
      // wait briefly so `loadResume()` doesn't overwrite the user's
      // just-typed academic fields with stale DB values.
      if (useResumeStore.getState().isSaving) {
        await new Promise((r) => setTimeout(r, 1200));
      }
      const currentResumeId = useResumeStore.getState().resumeId;

      if (currentResumeId) {
        try {
          await loadResume(currentResumeId);
        } catch {
          // Auth might have expired or resume missing — send to start
          if (!cancelled) router.replace("/start");
          return;
        }
      } else {
        // No resume yet — must choose "Start from scratch" or "Upload" on /start first
        if (!cancelled) router.replace("/start");
        return;
      }
      if (!cancelled) setInitDone(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loadResume, router]);

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.href));
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    setCurrentStep(currentStep + 1);
  }, [currentStep, setCurrentStep]);

  // Reset to form tab on route change
  useEffect(() => {
    setMobileTab("form");
  }, [pathname]);

  return (
    <div className="relative flex h-screen flex-col bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--primary)/.06,transparent_70%)]"
        aria-hidden
      />

      {/* ─── Top bar ─── */}
      <header className="relative z-40 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex items-center justify-between px-5 py-3 sm:px-8">
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
            <UserProfileButton inline />
            <ThemeToggle className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-muted" />
          </div>
        </div>

        <div className="h-0.5 w-full bg-border/30">
          <motion.div
            className="h-full bg-foreground/70"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </header>

      {/* ─── Mobile tab toggle ─── */}
      <div className="relative z-30 flex shrink-0 border-b border-border/40 bg-background/60 backdrop-blur-sm xl:hidden">
        <button
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2.5 text-center font-manrope text-xs font-medium transition-colors ${
            mobileTab === "form"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 text-center font-manrope text-xs font-medium transition-colors ${
            mobileTab === "preview"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Preview
        </button>
      </div>

      {/* ─── Split-screen content ─── */}
      <div className="relative flex min-h-0 flex-1">
        {/* ─── LEFT: Stepper + Form ─── */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-slim ${
            mobileTab === "preview" ? "hidden xl:block" : ""
          }`}
        >
          <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
              {/* ─── Sidebar stepper (desktop) ─── */}
              <nav className="hidden lg:block lg:w-48 lg:shrink-0">
                <div className="sticky top-6">
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
                    transition={{
                      duration: 0.35,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
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

        {/* ─── RIGHT: Live Preview ─── */}
        <div
          className={`w-full overflow-y-auto scrollbar-slim bg-muted/20 xl:w-[45%] xl:border-l xl:border-border/30 ${
            mobileTab === "form" ? "hidden xl:block" : ""
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/80 px-4 py-2.5 backdrop-blur-sm">
            <TemplateSwitch />
            <span className="font-dm-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
              Live preview
            </span>
          </div>
          <div className="p-5">
            {initDone ? (
              <LivePreview />
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-lg border border-border/30 bg-white shadow-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
