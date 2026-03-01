"use client";

import { useState, useCallback, useEffect } from "react";
import { useResumeStore } from "@/store/resumeStore";
import type { EditorStyles } from "@/store/resumeStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const FONTS = [
  "Georgia",
  "Times New Roman",
  "Palatino",
  "Helvetica Neue",
  "Arial",
  "Inter",
  "Lato",
  "Roboto",
];

const DIVIDER_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "double", label: "Double line" },
  { value: "dotted", label: "Dotted" },
  { value: "none", label: "None" },
];

const MARGIN_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
];

export function StyleControls() {
  const resumeId = useResumeStore((s) => s.resumeId);
  const storeStyles = useResumeStore((s) => s.editorStyles);
  const setEditorStyles = useResumeStore((s) => s.setEditorStyles);
  const [styles, setStyles] = useState<EditorStyles>({
    fontFamily: "Georgia",
    fontSize: 11,
    headingSize: 14,
    accentColor: "#000000",
    lineSpacing: 1.15,
    marginSize: "normal",
    sectionDivider: "line",
  });
  const [saving, setSaving] = useState(false);

  // Sync from store when it loads (e.g. after loadResume)
  useEffect(() => {
    if (storeStyles) {
      setStyles(storeStyles);
    }
  }, [storeStyles]);

  const save = useCallback(
    async (updated: Partial<EditorStyles>) => {
      if (!resumeId) return;
      setSaving(true);
      try {
        await fetch(`${API_BASE}/resume/${resumeId}/styles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updated),
        });
        setEditorStyles(updated);
      } catch {
        // silently fail
      } finally {
        setSaving(false);
      }
    },
    [resumeId, setEditorStyles]
  );

  const update = (field: keyof EditorStyles, value: string | number) => {
    const next = { ...styles, [field]: value };
    setStyles(next);
    setEditorStyles({ [field]: value });
    save({ [field]: value });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
        Style{" "}
        {saving && (
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">
            saving...
          </span>
        )}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Font
          </label>
          <select
            value={styles.fontFamily}
            onChange={(e) => update("fontFamily", e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-manrope text-xs text-foreground outline-none focus:border-primary"
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Font size
          </label>
          <input
            type="number"
            min={8}
            max={14}
            value={styles.fontSize}
            onChange={(e) => update("fontSize", parseInt(e.target.value) || 11)}
            className="w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-manrope text-xs text-foreground outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Heading size
          </label>
          <input
            type="number"
            min={10}
            max={20}
            value={styles.headingSize}
            onChange={(e) => update("headingSize", parseInt(e.target.value) || 14)}
            className="w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-manrope text-xs text-foreground outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Accent color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={styles.accentColor}
              onChange={(e) => update("accentColor", e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="font-dm-mono text-[10px] text-muted-foreground">
              {styles.accentColor}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Line spacing
          </label>
          <input
            type="range"
            min={1}
            max={2}
            step={0.05}
            value={styles.lineSpacing}
            onChange={(e) => update("lineSpacing", parseFloat(e.target.value))}
            className="w-full accent-foreground"
          />
          <span className="font-dm-mono text-[10px] text-muted-foreground">
            {styles.lineSpacing.toFixed(2)}
          </span>
        </div>

        <div>
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Margins
          </label>
          <select
            value={styles.marginSize}
            onChange={(e) => update("marginSize", e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-manrope text-xs text-foreground outline-none focus:border-primary"
          >
            {MARGIN_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="mb-1 block font-manrope text-[11px] text-muted-foreground">
            Section divider
          </label>
          <div className="flex gap-2">
            {DIVIDER_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => update("sectionDivider", d.value)}
                className={`rounded-md border px-3 py-1 font-manrope text-[11px] transition-all ${
                  styles.sectionDivider === d.value
                    ? "border-foreground bg-foreground/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
