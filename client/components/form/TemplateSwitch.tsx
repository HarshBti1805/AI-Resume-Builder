"use client";

import { useResumeStore } from "@/store/resumeStore";
import type { TemplateType } from "@/store/resumeStore";

const templates: { value: TemplateType; label: string }[] = [
  { value: "CLASSIC", label: "Classic" },
  { value: "MODERN", label: "Modern" },
  { value: "MINIMAL", label: "Minimal" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "COMPACT", label: "Compact" },
  { value: "ELEGANT", label: "Elegant" },
];

export function TemplateSwitch() {
  const selectedTemplate = useResumeStore((s) => s.selectedTemplate);
  const setTemplateLocal = useResumeStore((s) => s.setTemplateLocal);

  return (
    <div className="flex items-center gap-2.5">
      <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Template
      </span>
      <select
        value={selectedTemplate || "CLASSIC"}
        onChange={(e) => setTemplateLocal(e.target.value as TemplateType)}
        className="font-manrope rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {templates.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
