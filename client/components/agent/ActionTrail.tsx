"use client";

import type { AgentToolEvent } from "@/store/agentStore";

/**
 * Inline "what the agent is doing" trail rendered under an assistant message.
 * Running steps show a spinner; completed steps show a check.
 */
export function ActionTrail({ events }: { events: AgentToolEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {events.map((e, i) => {
        const running = e.status === "running";
        return (
          <div
            key={`${e.tool}-${i}`}
            className="flex items-center gap-2 font-manrope text-[11px] text-muted-foreground"
          >
            {running ? (
              <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-muted-foreground/30 border-t-foreground" />
            ) : (
              <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none">
                  <path
                    d="M2.5 6.2 4.8 8.5 9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            <span className={running ? "" : "text-foreground/70"}>
              {e.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
