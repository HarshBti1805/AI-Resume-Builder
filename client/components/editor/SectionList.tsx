"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useResumeStore } from "@/store/resumeStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const DEFAULT_SECTION_ORDER = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "achievements",
  "hobbies",
];

const DEFAULT_LABELS: Record<string, string> = {
  summary: "Summary",
  education: "Education",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  achievements: "Achievements",
  hobbies: "Hobbies",
};

interface SectionItem {
  id: string;
  label: string;
  isCustom: boolean;
}

interface Props {
  onOrderChange?: (order: string[]) => void;
  activeSection?: string;
  onSectionClick?: (id: string) => void;
}

function SortableSectionRow({
  item,
  isActive,
  onClick,
  onRename,
  onHide,
  canHide,
}: {
  item: SectionItem;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string, label: string) => void;
  onHide: (id: string) => void;
  canHide: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.label);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  useEffect(() => {
    setEditValue(item.label);
  }, [item.label]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const handleBlur = () => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.label) {
      onRename(item.id, trimmed);
    } else {
      setEditValue(item.label);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 transition-all ${
        isActive
          ? "border-foreground/20 bg-foreground/[0.06]"
          : "border-transparent hover:bg-foreground/[0.03]"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </button>

      {editing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setEditValue(item.label);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded border border-primary/40 bg-transparent px-1.5 py-0.5 font-manrope text-sm text-foreground outline-none focus:border-primary"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!item.isCustom) setEditing(true);
          }}
          className="min-w-0 flex-1 truncate text-left font-manrope text-sm text-foreground"
          title={item.isCustom ? undefined : "Double-click to rename"}
        >
          {item.label}
        </button>
      )}

      {canHide && !item.isCustom && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHide(item.id);
          }}
          className="shrink-0 rounded p-1 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
          aria-label="Remove section from resume"
          title="Remove section from resume"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function SectionList({ onOrderChange, activeSection, onSectionClick }: Props) {
  const resumeId = useResumeStore((s) => s.resumeId);
  const sectionOrder = useResumeStore((s) => s.sectionOrder);
  const sectionTitles = useResumeStore((s) => s.sectionTitles);
  const setSectionOrder = useResumeStore((s) => s.setSectionOrder);
  const setSectionTitles = useResumeStore((s) => s.setSectionTitles);
  const customSections = useResumeStore((s) => s.customSections);

  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const orderedIds: string[] =
    sectionOrder?.length > 0 ? [...sectionOrder] : [...DEFAULT_SECTION_ORDER];
  customSections?.forEach((cs) => {
    if (!orderedIds.includes(cs.id)) orderedIds.push(cs.id);
  });

  const sections: SectionItem[] = orderedIds.map((id) => {
    const isCustom = customSections?.some((c) => c.id === id);
    const label = isCustom
      ? (customSections?.find((c) => c.id === id)?.title ?? "Custom Section")
      : (sectionTitles?.[id] ?? DEFAULT_LABELS[id] ?? id);
    return { id, label, isCustom };
  });

  const hiddenStandardSections = DEFAULT_SECTION_ORDER.filter((id) => !orderedIds.includes(id));

  const saveOrder = useCallback(
    async (newOrder: string[]) => {
      if (!resumeId) return;
      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/resume/${resumeId}/sections/order`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sectionOrder: newOrder }),
        });
        if (res.ok) setSectionOrder(newOrder);
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    },
    [resumeId, setSectionOrder]
  );

  const saveTitles = useCallback(
    async (titles: Record<string, string>) => {
      if (!resumeId) return;
      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/resume/${resumeId}/sections/order`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sectionTitles: titles }),
        });
        if (res.ok) setSectionTitles(titles);
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    },
    [resumeId, setSectionTitles]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sections, oldIndex, newIndex);
    const newOrder = reordered.map((s) => s.id);
    setSectionOrder(newOrder);
    onOrderChange?.(newOrder);
    saveOrder(newOrder);
  };

  const handleRename = (id: string, label: string) => {
    const next = { ...sectionTitles, [id]: label };
    setSectionTitles(next);
    saveTitles(next);
  };

  const handleHide = (id: string) => {
    const newOrder = orderedIds.filter((x) => x !== id);
    setSectionOrder(newOrder);
    onOrderChange?.(newOrder);
    saveOrder(newOrder);
  };

  const handleAddSection = (id: string) => {
    setShowAddMenu(false);
    if (orderedIds.includes(id)) return;
    const defaultIdx = DEFAULT_SECTION_ORDER.indexOf(id);
    let insertAt = orderedIds.length;
    for (let i = 0; i < orderedIds.length; i++) {
      const j = DEFAULT_SECTION_ORDER.indexOf(orderedIds[i]);
      if (j !== -1 && j > defaultIdx) {
        insertAt = i;
        break;
      }
    }
    const newOrder = [...orderedIds.slice(0, insertAt), id, ...orderedIds.slice(insertAt)];
    setSectionOrder(newOrder);
    onOrderChange?.(newOrder);
    saveOrder(newOrder);
  };

  return (
    <div className="flex flex-col gap-2">
      {saving && (
        <p className="font-dm-mono text-[10px] text-muted-foreground">Saving…</p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {sections.map((s) => (
              <SortableSectionRow
                key={s.id}
                item={s}
                isActive={activeSection === s.id}
                onClick={() => onSectionClick?.(s.id)}
                onRename={handleRename}
                onHide={handleHide}
                canHide={sections.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hiddenStandardSections.length > 0 && (
        <div className="relative mt-2 border-t border-border/40 pt-2">
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="font-manrope text-[11px] text-primary/80 hover:text-primary"
          >
            + Add section to resume
          </button>
          {showAddMenu && (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
              {hiddenStandardSections.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleAddSection(id)}
                  className="block w-full px-3 py-1.5 text-left font-manrope text-xs text-foreground hover:bg-foreground/5"
                >
                  {DEFAULT_LABELS[id] ?? id}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
