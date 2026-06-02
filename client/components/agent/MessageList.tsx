"use client";

import { useEffect, useRef } from "react";
import type { AgentChatMessage } from "@/store/agentStore";
import { ActionTrail } from "./ActionTrail";

const SUGGESTIONS = [
  "Tailor my resume to a job description",
  "Improve my ATS score",
  "Make my summary more impactful",
  "Add my best GitHub projects",
];

export function MessageList({
  messages,
  streaming,
  onSuggestion,
}: {
  messages: AgentChatMessage[];
  streaming: boolean;
  onSuggestion: (text: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/[0.06]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-foreground" fill="none">
            <path
              d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="space-y-1.5">
          <h2 className="font-space-grotesk text-lg font-semibold text-foreground">
            Build your resume by chatting
          </h2>
          <p className="mx-auto max-w-sm font-manrope text-sm text-muted-foreground">
            Tell the AI what you want. It edits your resume automatically and you
            can undo any change. Try one of these:
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 font-manrope text-xs text-foreground transition-colors hover:border-foreground/40 hover:bg-card"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function Bubble({ message }: { message: AgentChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 font-manrope text-sm text-background">
          {message.content}
        </div>
      </div>
    );
  }

  const showTyping =
    message.streaming && !message.content && (message.toolEvents?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.06] font-dm-mono text-[9px] uppercase text-foreground">
          AI
        </span>
        <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Assistant
        </span>
      </div>
      <div className="pl-7">
        {showTyping ? (
          <div className="flex gap-1 py-1">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap font-manrope text-sm leading-relaxed text-foreground">
            {message.content}
          </p>
        )}
        {message.toolEvents && message.toolEvents.length > 0 && (
          <ActionTrail events={message.toolEvents} />
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
      style={{ animationDelay: delay }}
    />
  );
}
