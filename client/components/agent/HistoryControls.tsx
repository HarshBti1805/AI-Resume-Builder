"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/store/agentStore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function HistoryControls({ resumeId }: { resumeId: string }) {
  const snapshots = useAgentStore((s) => s.snapshots);
  const undoLast = useAgentStore((s) => s.undoLast);
  const restoreSnapshot = useAgentStore((s) => s.restoreSnapshot);
  const streaming = useAgentStore((s) => s.streaming);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasHistory = snapshots.length > 0;

  const doUndo = async () => {
    setBusy(true);
    try {
      await undoLast(resumeId);
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (id: string) => {
    setBusy(true);
    try {
      await restoreSnapshot(resumeId, id);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <button
        type="button"
        onClick={doUndo}
        disabled={!hasHistory || busy || streaming}
        title="Undo the last AI change"
        className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 font-manrope text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path
            d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Undo
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={!hasHistory}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 font-manrope text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          History
          {hasHistory && (
            <span className="rounded-full bg-foreground/10 px-1.5 font-dm-mono text-[10px]">
              {snapshots.length}
            </span>
          )}
        </button>

        {open && hasHistory && (
          <div className="absolute right-0 z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            <div className="border-b border-border/40 px-3 py-2">
              <p className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Restore points
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {snapshots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => doRestore(s.id)}
                  disabled={busy}
                  className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-manrope text-xs text-foreground">
                      {s.label || "Resume change"}
                    </span>
                    <span className="font-manrope text-[10px] text-muted-foreground/60">
                      {timeAgo(s.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 font-manrope text-[10px] text-primary">
                    Restore
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
