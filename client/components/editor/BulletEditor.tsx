"use client";

import { Fragment } from "react";
import type { Bullet } from "@/store/resumeStore";
import { AIButton } from "./AIButton";

interface BulletEditorProps {
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
  placeholder?: string;
  context?: string;
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
    <div className="flex flex-col gap-1.5">
      {items.map((bullet, i) => (
        <Fragment key={i}>
          <div className="group flex items-start gap-2">
            <span className="mt-2.5 text-xs text-muted-foreground select-none">
              {"\u2022"}
            </span>
            <textarea
              value={bullet.text}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              rows={1}
              placeholder={placeholder || "Describe what you did..."}
              className="font-manrope flex-1 resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
              style={{ minHeight: "32px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-2 text-xs text-muted-foreground/0 transition-all group-hover:text-muted-foreground hover:!text-red-500"
              tabIndex={-1}
            >
              ×
            </button>
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
        className="ml-4 mt-0.5 self-start font-manrope text-[11px] text-primary/70 transition-colors hover:text-primary"
      >
        + Add bullet
      </button>
    </div>
  );
}
