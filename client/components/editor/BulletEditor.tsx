"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import type { Bullet } from "@/store/resumeStore";
import { AIButton } from "./AIButton";

interface BulletEditorProps {
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
  placeholder?: string;
  context?: string;
}

// Textarea that always grows to fit its content — on mount and on every value
// change (not just while typing), so pre-filled multi-line bullets aren't clipped.
function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      rows={1}
      placeholder={placeholder || "Describe what you did..."}
      className="font-manrope min-w-0 flex-1 resize-none overflow-hidden rounded-md border border-border bg-muted/30 px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
    />
  );
}

export function BulletEditor({ bullets, onChange, placeholder, context }: BulletEditorProps) {
  const items = bullets.length > 0 ? bullets : [{ text: "" }];

  const update = (index: number, text: string) => {
    onChange(items.map((b, i) => (i === index ? { ...b, text } : b)));
  };

  const add = () => onChange([...items, { text: "" }]);

  const remove = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onChange([
        ...items.slice(0, index + 1),
        { text: "" },
        ...items.slice(index + 1),
      ]);
    }
    if (e.key === "Backspace" && items[index]?.text === "" && items.length > 1) {
      e.preventDefault();
      remove(index);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((bullet, i) => (
        <Fragment key={i}>
          <div className="group flex items-start gap-2">
            <span className="mt-2.5 select-none text-xs text-muted-foreground">
              {"\u2022"}
            </span>
            <AutoTextarea
              value={bullet.text}
              onChange={(v) => update(i, v)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-1.5 shrink-0 rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                aria-label="Remove bullet"
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </div>
          {bullet.text.trim() && (
            <div className="ml-5 flex gap-1">
              <AIButton
                action="improve"
                bulletText={bullet.text}
                context={context || "resume"}
                onAccept={(newText) => update(i, newText)}
              />
              <AIButton
                action="keywords"
                bulletText={bullet.text}
                context={context || "resume"}
                onAccept={(newText) => update(i, newText)}
              />
            </div>
          )}
        </Fragment>
      ))}
      <button
        type="button"
        onClick={add}
        className="ml-5 mt-0.5 self-start font-manrope text-[11px] text-primary/70 transition-colors hover:text-primary"
      >
        + Add bullet
      </button>
    </div>
  );
}
