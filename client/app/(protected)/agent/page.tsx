"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useResumeStore } from "@/store/resumeStore";
import { LivePreview } from "@/components/preview/LivePreview";
import { TemplateSwitch } from "@/components/form/TemplateSwitch";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";
import { ChatPanel } from "@/components/agent/ChatPanel";
import { HistoryControls } from "@/components/agent/HistoryControls";

export default function AgentPage() {
  const { resumeId, loadResume, initResume, isSaving } = useResumeStore();
  const [initDone, setInitDone] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

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

  if (!initDone || !resumeId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <p className="font-manrope text-sm text-muted-foreground">
            Starting your AI assistant…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ─── Navbar ─── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-background px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/preview"
            className="shrink-0 font-manrope text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Preview
          </Link>
          <span className="hidden shrink-0 items-center gap-1.5 font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 sm:inline-flex">
            Agentic Mode
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <HistoryControls resumeId={resumeId} />
          </div>
          <TemplateSwitch />
          <UserProfileButton inline />
          <ThemeToggle className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-muted" />
        </div>
      </header>

      {/* ─── Mobile tab toggle ─── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 lg:hidden">
        <div className="flex flex-1">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2 text-center font-manrope text-xs font-medium transition-colors ${
              mobileTab === "chat"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Chat
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
      </div>

      {/* Mobile history controls */}
      <div className="flex shrink-0 justify-end border-b border-border/40 px-3 py-1.5 sm:hidden">
        <HistoryControls resumeId={resumeId} />
      </div>

      {/* ─── Main split ─── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: chat */}
        <div
          className={`min-h-0 flex-1 flex-col lg:flex ${
            mobileTab === "chat" ? "flex" : "hidden"
          }`}
        >
          <ChatPanel resumeId={resumeId} />
        </div>

        {/* Right: live preview */}
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
