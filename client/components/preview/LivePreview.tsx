"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useResumeStore } from "@/store/resumeStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const DEBOUNCE_MS = 1500;

// A4 at 96 DPI
const A4_W = 794;
const A4_H = 1123;

const DEFAULT_SECTION_ORDER = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "achievements",
  "hobbies",
];

function assembleResumeData() {
  const s = useResumeStore.getState();

  const flatSkills = s.step3.skillCategories.flatMap((c) => c.skills);

  const customSectionsList = s.customSections || [];
  const customSectionIds = customSectionsList.map((cs) => cs.id);
  let sectionOrder: string[] =
    s.sectionOrder?.length > 0 ? [...s.sectionOrder] : [...DEFAULT_SECTION_ORDER];
  customSectionIds.forEach((id) => {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  });

  const customSectionsById: Record<string, { title: string; items: { text: string }[] }> = {};
  customSectionsList.forEach((cs) => {
    customSectionsById[cs.id] = {
      title: cs.title,
      items: (cs.items || []).map((it) => ({ text: it.text })),
    };
  });

  return {
    fullName: s.step1.fullName,
    dateOfBirth: s.step1.dateOfBirth,
    phone: s.step1.phone,
    contactEmail: s.step1.contactEmail,
    city: s.step1.city,
    state: s.step1.state,
    linkedin: s.step1.linkedin,
    github: s.step1.github,
    portfolio: s.step1.portfolio,
    photoUrl: s.step1.photoUrl,
    university: s.step2.university,
    stream: s.step2.stream,
    branch: s.step2.branch,
    batchStart: s.step2.batchStart ? parseInt(s.step2.batchStart) : null,
    batchEnd: s.step2.batchEnd ? parseInt(s.step2.batchEnd) : null,
    cgpa: s.step2.cgpa ? parseFloat(s.step2.cgpa) : null,
    marks12th: s.step2.marks12th ? parseFloat(s.step2.marks12th) : null,
    board12th: s.step2.board12th,
    marks10th: s.step2.marks10th ? parseFloat(s.step2.marks10th) : null,
    board10th: s.step2.board10th,
    coursework: s.step2.coursework,
    skills: flatSkills,
    skillCategories: s.step3.skillCategories.map((c, i) => ({
      ...c,
      sortOrder: i,
    })),
    projects: s.step3.projects.map((p, i) => ({
      ...p,
      sortOrder: i,
      bullets: (p.bullets || []).map((b, bi) => ({
        text: b.text,
        sortOrder: bi,
      })),
    })),
    internships: s.step4.internships.map((int, i) => ({
      ...int,
      sortOrder: i,
      bullets: (int.bullets || []).map((b, bi) => ({
        text: b.text,
        sortOrder: bi,
      })),
    })),
    achievements: s.step4.achievements.map((a, i) => ({
      ...a,
      sortOrder: i,
    })),
    hobbies: (s.step5.hobbyItems || []).map((h) => h.name),
    hobbyItems: (s.step5.hobbyItems || []).map((h, i) => ({
      ...h,
      sortOrder: i,
    })),
    summary: s.step5.summary,
    // Editor: custom sections and styles for live preview
    customSections: (s.customSections || []).map((cs, i) => ({
      id: cs.id,
      title: cs.title,
      sortOrder: i,
      items: (cs.items || []).map((it, j) => ({
        id: (it as { id?: string }).id,
        text: it.text,
        sortOrder: j,
      })),
    })),
    customSectionsById,
    sectionOrder,
    sectionTitles: s.sectionTitles || {},
    fontFamily: s.editorStyles?.fontFamily ?? "Georgia",
    fontSize: s.editorStyles?.fontSize ?? 11,
    headingSize: s.editorStyles?.headingSize ?? 14,
    accentColor: s.editorStyles?.accentColor ?? "#000000",
    lineSpacing: s.editorStyles?.lineSpacing ?? 1.15,
    marginSize: s.editorStyles?.marginSize ?? "normal",
    sectionDivider: s.editorStyles?.sectionDivider ?? "line",
  };
}

export function LivePreview() {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [contentH, setContentH] = useState(A4_H);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const step1 = useResumeStore((s) => s.step1);
  const step2 = useResumeStore((s) => s.step2);
  const step3 = useResumeStore((s) => s.step3);
  const step4 = useResumeStore((s) => s.step4);
  const step5 = useResumeStore((s) => s.step5);
  const selectedTemplate = useResumeStore((s) => s.selectedTemplate);
  const customSections = useResumeStore((s) => s.customSections);
  const editorStyles = useResumeStore((s) => s.editorStyles);
  const sectionOrder = useResumeStore((s) => s.sectionOrder);
  const sectionTitles = useResumeStore((s) => s.sectionTitles);

  // Dynamically compute scale so the full A4 page fits the container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setScale(Math.min(width / A4_W, 1));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const measureIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc?.body) {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        setContentH(Math.max(h, A4_H));
      }
    } catch {
      // cross-origin guard
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRefreshing(true);

    try {
      const data = assembleResumeData();
      const res = await fetch(`${API_BASE}/resume/preview-live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          template: selectedTemplate || "CLASSIC",
          data,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Preview failed");

      const text = await res.text();
      setHtml(text);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      fetchPreview();
    }, isLoading ? 300 : DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1, step2, step3, step4, step5, selectedTemplate, customSections, editorStyles, sectionOrder, sectionTitles, fetchPreview]);

  const scaledH = contentH * scale;

  if (isLoading) {
    return (
      <div ref={containerRef} className="w-full">
        <div
          className="flex items-center justify-center rounded-lg border border-border/30 bg-white shadow-sm"
          style={{ height: scaledH || 560 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            <p className="font-manrope text-xs text-zinc-400">
              Loading preview…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {isRefreshing && (
        <div className="absolute right-3 top-3 z-10">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        </div>
      )}
      {/* Outer wrapper clips to the scaled dimensions */}
      <div
        className="overflow-hidden rounded-lg border border-border/30 bg-white shadow-sm"
        style={{ height: scaledH }}
      >
        {/* Inner: render at full A4 width, actual content height, scale down to fit */}
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="Resume Preview"
          className="border-0 bg-white"
          sandbox="allow-same-origin"
          onLoad={measureIframeContent}
          style={{
            width: A4_W,
            height: contentH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
