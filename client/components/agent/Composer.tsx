"use client";

import { useRef, useState } from "react";

export function Composer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const autosize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-border/40 bg-background p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2 transition-colors focus-within:border-primary focus-within:bg-background">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autosize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask the AI to edit your resume…"
          className="max-h-40 flex-1 resize-none bg-transparent font-manrope text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <p className="mt-1.5 px-1 font-manrope text-[10px] text-muted-foreground/50">
        Edits apply automatically. Use Undo or History to roll back.
      </p>
    </div>
  );
}
