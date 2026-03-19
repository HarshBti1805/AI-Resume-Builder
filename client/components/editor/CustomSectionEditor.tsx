"use client";

import { useState, useCallback, useEffect } from "react";
import { useResumeStore } from "@/store/resumeStore";
import type { CustomSection } from "@/store/resumeStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface CustomSectionItem {
  id?: string;
  text: string;
}

export function CustomSectionEditor() {
  const resumeId = useResumeStore((s) => s.resumeId);
  const storeSections = useResumeStore((s) => s.customSections);
  const setCustomSections = useResumeStore((s) => s.setCustomSections);
  const sectionOrder = useResumeStore((s) => s.sectionOrder);
  const setSectionOrder = useResumeStore((s) => s.setSectionOrder);
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Sync from store when it loads (e.g. after loadResume)
  useEffect(() => {
    setSections(storeSections ?? []);
  }, [storeSections]);

  const addSection = useCallback(async () => {
    if (!resumeId) return;
    setIsAdding(true);
    try {
      const res = await fetch(`${API_BASE}/resume/${resumeId}/sections/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Custom Section",
          items: [{ text: "" }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newSection = data.data.section;
        const newId = newSection.id;
        setSections((prev) => {
          const next = [...prev, { id: newId, title: newSection.title ?? "Custom Section", items: (newSection.items ?? []).map((it: { id?: string; text: string }) => ({ id: it.id, text: it.text ?? "" })) }];
          setCustomSections(next);
          return next;
        });
        const currentOrder = useResumeStore.getState().sectionOrder ?? [];
        const nextOrder = currentOrder.includes(newId)
          ? currentOrder
          : [...currentOrder, newId];
        setSectionOrder(nextOrder);
        fetch(`${API_BASE}/resume/${resumeId}/sections/order`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sectionOrder: nextOrder }),
        }).catch(() => {});
      }
    } catch {
      // silently fail
    } finally {
      setIsAdding(false);
    }
  }, [resumeId, setCustomSections, setSectionOrder]);

  const updateSection = useCallback(
    async (sId: string, title: string, items: CustomSectionItem[]) => {
      if (!resumeId) return;
      try {
        await fetch(`${API_BASE}/resume/${resumeId}/sections/custom/${sId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, items }),
        });
        setSections((prev) => {
          const next = prev.map((s) =>
            s.id === sId ? { ...s, title, items } : s
          );
          setCustomSections(next);
          return next;
        });
      } catch {
        // silently fail
      }
    },
    [resumeId, setCustomSections]
  );

  const deleteSection = useCallback(
    async (sId: string) => {
      if (!resumeId) return;
      try {
        await fetch(`${API_BASE}/resume/${resumeId}/sections/custom/${sId}`, {
          method: "DELETE",
          credentials: "include",
        });
        setSections((prev) => {
          const next = prev.filter((s) => s.id !== sId);
          setCustomSections(next);
          return next;
        });
        const newOrder = (sectionOrder ?? []).filter((id) => id !== sId);
        setSectionOrder(newOrder);
        await fetch(`${API_BASE}/resume/${resumeId}/sections/order`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sectionOrder: newOrder }),
        });
      } catch {
        // silently fail
      }
    },
    [resumeId, setCustomSections, setSectionOrder, sectionOrder]
  );

  const handleTitleChange = (sId: string, title: string) => {
    setSections((prev) => {
      const next = prev.map((s) => (s.id === sId ? { ...s, title } : s));
      setCustomSections(next);
      return next;
    });
  };

  const handleItemChange = (sId: string, index: number, text: string) => {
    setSections((prev) => {
      const next = prev.map((s) =>
        s.id === sId
          ? {
              ...s,
              items: s.items.map((item, i) =>
                i === index ? { ...item, text } : item
              ),
            }
          : s
      );
      setCustomSections(next);
      return next;
    });
  };

  const addItem = (sId: string) => {
    setSections((prev) => {
      const next = prev.map((s) =>
        s.id === sId ? { ...s, items: [...s.items, { text: "" }] } : s
      );
      setCustomSections(next);
      return next;
    });
  };

  const removeItem = (sId: string, index: number) => {
    setSections((prev) => {
      const next = prev.map((s) =>
        s.id === sId
          ? { ...s, items: s.items.filter((_, i) => i !== index) }
          : s
      );
      setCustomSections(next);
      return next;
    });
  };

  const handleBlur = (section: CustomSection) => {
    updateSection(section.id, section.title, section.items);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
          Custom sections
        </h3>
        <button
          type="button"
          onClick={addSection}
          disabled={isAdding}
          className="font-manrope rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15 disabled:opacity-50"
        >
          {isAdding ? "Adding..." : "+ Add section"}
        </button>
      </div>

      {sections.length === 0 && (
        <p className="font-manrope text-xs text-muted-foreground/60">
          No custom sections yet. Add one for certifications, publications, or
          any additional info.
        </p>
      )}

      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <input
              value={section.title}
              onChange={(e) => handleTitleChange(section.id, e.target.value)}
              onBlur={() => handleBlur(section)}
              placeholder="Section title"
              className="font-manrope rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-primary"
            />
            <button
              type="button"
              onClick={() => deleteSection(section.id)}
              className="font-manrope text-xs text-muted-foreground transition-colors hover:text-red-500"
            >
              Delete section
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {section.items.map((item, i) => (
              <div key={i} className="group flex items-start gap-2">
                <span className="mt-2 text-xs text-muted-foreground">{"\u2022"}</span>
                <textarea
                  value={item.text}
                  onChange={(e) =>
                    handleItemChange(section.id, i, e.target.value)
                  }
                  onBlur={() => handleBlur(section)}
                  rows={1}
                  placeholder="Add content..."
                  className="font-manrope flex-1 resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 hover:border-border focus:border-primary"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeItem(section.id, i)}
                  className="mt-2 text-xs text-muted-foreground/0 transition-all group-hover:text-muted-foreground hover:!text-red-500"
                  tabIndex={-1}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(section.id)}
              className="ml-4 self-start font-manrope text-[11px] text-primary/70 transition-colors hover:text-primary"
            >
              + Add item
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
