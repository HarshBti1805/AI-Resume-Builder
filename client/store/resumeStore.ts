import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import api from "../lib/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Bullet {
  id?: string;
  text: string;
}

export interface Project {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  bullets: Bullet[];
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface Internship {
  id?: string;
  company: string;
  role: string;
  description: string;
  bullets: Bullet[];
  startDate?: string;
  endDate?: string;
}

export interface Achievement {
  id?: string;
  title: string;
  description?: string;
  link?: string;
  type?: "COMPETITION" | "CERTIFICATION" | "HACKATHON" | "PUBLICATION" | "COMMUNITY" | "OTHER";
}

export interface SkillCategory {
  id?: string;
  name: string;
  skills: string[];
}

export interface HobbyItem {
  id?: string;
  name: string;
  description?: string;
}

export interface Step1Data {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  contactEmail: string;
  city: string;
  state: string;
  linkedin: string;
  github: string;
  portfolio: string;
  photoUrl: string;
}

export interface Step2Data {
  university: string;
  stream: string;
  branch: string;
  batchStart: string;
  batchEnd: string;
  cgpa: string;
  marks12th: string;
  board12th: string;
  marks10th: string;
  board10th: string;
  coursework: string[];
}

export interface Step3Data {
  skillCategories: SkillCategory[];
  projects: Project[];
}

export interface Step4Data {
  internships: Internship[];
  achievements: Achievement[];
}

export interface Step5Data {
  summary: string;
  hobbyItems: HobbyItem[];
}

export interface CustomSectionItem {
  id?: string;
  text: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface EditorStyles {
  fontFamily: string;
  fontSize: number;
  headingSize: number;
  accentColor: string;
  lineSpacing: number;
  marginSize: string;
  sectionDivider: string;
}

export type TemplateType =
  | "CLASSIC"
  | "MODERN"
  | "MINIMAL"
  | "ACADEMIC"
  | "TECHNICAL";

// ─────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────

export interface ResumeStore {
  // Meta
  resumeId: string | null;
  currentStep: number;
  version: number;
  status: "DRAFT" | "COMPLETED";
  selectedTemplate: TemplateType | null;
  atsScore: number | null;

  // Save indicator
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;

  // Form data
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;

  // Editor-only (for live preview; not persisted to localStorage)
  customSections: CustomSection[];
  editorStyles: EditorStyles;
  sectionOrder: string[];
  sectionTitles: Record<string, string>;  // e.g. { experience: "Companies", education: "Academic" }

  // ── Actions ──
  initResume: () => Promise<string>;
  loadResume: (id: string) => Promise<void>;

  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  updateStep5: (data: Partial<Step5Data>) => void;

  saveStep1: () => Promise<void>;
  saveStep2: () => Promise<void>;
  saveStep3: () => Promise<void>;
  saveStep4: () => Promise<void>;
  saveStep5: () => Promise<void>;
  saveAllSteps: () => Promise<void>;

  setTemplate: (template: TemplateType) => Promise<void>;
  setTemplateLocal: (template: TemplateType) => void;
  setPhotoUrl: (url: string) => void;
  setAtsScore: (score: number) => void;
  setCurrentStep: (step: number) => void;

  setCustomSections: (sections: CustomSection[]) => void;
  setEditorStyles: (styles: Partial<EditorStyles>) => void;
  setSectionOrder: (order: string[]) => void;
  setSectionTitles: (titles: Record<string, string>) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prefillFromParsed: (parsed: any) => void;

  reset: () => void;
}

// ─────────────────────────────────────────────
// Default state slices
// ─────────────────────────────────────────────

const defaultStep1: Step1Data = {
  fullName: "",
  dateOfBirth: "",
  phone: "",
  contactEmail: "",
  city: "",
  state: "",
  linkedin: "",
  github: "",
  portfolio: "",
  photoUrl: "",
};

const defaultStep2: Step2Data = {
  university: "",
  stream: "",
  branch: "",
  batchStart: "",
  batchEnd: "",
  cgpa: "",
  marks12th: "",
  board12th: "",
  marks10th: "",
  board10th: "",
  coursework: [],
};

const defaultStep3: Step3Data = { skillCategories: [], projects: [] };
const defaultStep4: Step4Data = { internships: [], achievements: [] };
const defaultStep5: Step5Data = { summary: "", hobbyItems: [] };

const defaultEditorStyles: EditorStyles = {
  fontFamily: "Georgia",
  fontSize: 11,
  headingSize: 14,
  accentColor: "#000000",
  lineSpacing: 1.15,
  marginSize: "normal",
  sectionDivider: "line",
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useResumeStore = create<ResumeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Meta ──
        resumeId: null,
        currentStep: 1,
        version: 1,
        status: "DRAFT",
        selectedTemplate: null,
        atsScore: null,

        // ── Save state ──
        isSaving: false,
        lastSaved: null,
        saveError: null,

        // ── Form data ──
        step1: defaultStep1,
        step2: defaultStep2,
        step3: defaultStep3,
        step4: defaultStep4,
        step5: defaultStep5,

        customSections: [],
        editorStyles: defaultEditorStyles,
        sectionOrder: [],
        sectionTitles: {},

        // ── Init / Load ──────────────────────────────────────────

        initResume: async () => {
          const res = await api.post("/resume");
          const resume = res.data.data.resume;
          set({
            resumeId: resume.id,
            version: resume.version,
            currentStep: resume.currentStep ?? 1,
            status: resume.status,
            // pre-fill email from auth
            step1: { ...defaultStep1, contactEmail: resume.contactEmail ?? "" },
          });
          return resume.id as string;
        },

        loadResume: async (id: string) => {
          const res = await api.get(`/resume/${id}`);
          const r = res.data.data.resume;
          set({
            resumeId: r.id,
            version: r.version,
            currentStep: r.currentStep ?? 1,
            status: r.status,
            selectedTemplate: r.selectedTemplate ?? null,
            atsScore: r.atsScore ?? null,
            step1: {
              fullName: r.fullName ?? "",
              dateOfBirth: r.dateOfBirth
                ? new Date(r.dateOfBirth).toISOString().split("T")[0]
                : "",
              phone: r.phone ?? "",
              contactEmail: r.contactEmail ?? "",
              city: r.city ?? "",
              state: r.state ?? "",
              linkedin: r.linkedin ?? "",
              github: r.github ?? "",
              portfolio: r.portfolio ?? "",
              photoUrl: r.photoUrl ?? "",
            },
            step2: {
              university: r.university ?? "",
              stream: r.stream ?? "",
              branch: r.branch ?? "",
              batchStart: r.batchStart ? String(r.batchStart) : "",
              batchEnd: r.batchEnd ? String(r.batchEnd) : "",
              cgpa: r.cgpa ? String(r.cgpa) : "",
              marks12th: r.marks12th ? String(r.marks12th) : "",
              board12th: r.board12th ?? "",
              marks10th: r.marks10th ? String(r.marks10th) : "",
              board10th: r.board10th ?? "",
              coursework: r.coursework ?? [],
            },
            step3: {
              skillCategories: (r.skillCategories ?? []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (c: any) => ({
                  id: c.id,
                  name: c.name,
                  skills: c.skills ?? [],
                })
              ),
              projects: (r.projects ?? []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p: any) => ({
                  id: p.id,
                  title: p.title,
                  subtitle: p.subtitle ?? "",
                  description: p.description ?? "",
                  bullets: (p.bullets ?? []).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (b: any) => ({ id: b.id, text: b.text })
                  ),
                  techStack: p.techStack ?? [],
                  liveUrl: p.liveUrl ?? "",
                  repoUrl: p.repoUrl ?? "",
                  startDate: p.startDate
                    ? new Date(p.startDate).toISOString().split("T")[0]
                    : "",
                  endDate: p.endDate
                    ? new Date(p.endDate).toISOString().split("T")[0]
                    : "",
                })
              ),
            },
            step4: {
              internships: (r.internships ?? []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (i: any) => ({
                  id: i.id,
                  company: i.company,
                  role: i.role,
                  description: i.description ?? "",
                  bullets: (i.bullets ?? []).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (b: any) => ({ id: b.id, text: b.text })
                  ),
                  startDate: i.startDate
                    ? new Date(i.startDate).toISOString().split("T")[0]
                    : "",
                  endDate: i.endDate
                    ? new Date(i.endDate).toISOString().split("T")[0]
                    : "",
                })
              ),
              achievements: (r.achievements ?? []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (a: any) => ({
                  id: a.id,
                  title: a.title,
                  description: a.description ?? "",
                  link: a.link ?? "",
                  type: a.type ?? "OTHER",
                })
              ),
            },
            step5: {
              summary: r.summary ?? "",
              hobbyItems: (r.hobbyItems ?? []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (h: any) => ({
                  id: h.id,
                  name: h.name,
                  description: h.description ?? "",
                })
              ),
            },
            customSections: (r.customSections ?? []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (cs: any) => ({
                id: cs.id,
                title: cs.title ?? "Custom Section",
                items: (cs.items ?? []).map((it: { id?: string; text: string }) => ({
                  id: it.id,
                  text: it.text ?? "",
                })),
              })
            ),
            editorStyles: {
              fontFamily: r.fontFamily ?? defaultEditorStyles.fontFamily,
              fontSize: r.fontSize ?? defaultEditorStyles.fontSize,
              headingSize: r.headingSize ?? defaultEditorStyles.headingSize,
              accentColor: r.accentColor ?? defaultEditorStyles.accentColor,
              lineSpacing: r.lineSpacing ?? defaultEditorStyles.lineSpacing,
              marginSize: r.marginSize ?? defaultEditorStyles.marginSize,
              sectionDivider: r.sectionDivider ?? defaultEditorStyles.sectionDivider,
            },
            sectionOrder: Array.isArray(r.sectionOrder) ? r.sectionOrder : [],
            sectionTitles:
              r.sectionTitles && typeof r.sectionTitles === "object"
                ? (r.sectionTitles as Record<string, string>)
                : {},
          });
        },

        // ── Local updates (instant, no API) ─────────────────────

        updateStep1: (data) =>
          set((s) => ({ step1: { ...s.step1, ...data } })),

        updateStep2: (data) =>
          set((s) => ({ step2: { ...s.step2, ...data } })),

        updateStep3: (data) =>
          set((s) => ({ step3: { ...s.step3, ...data } })),

        updateStep4: (data) =>
          set((s) => ({ step4: { ...s.step4, ...data } })),

        updateStep5: (data) =>
          set((s) => ({ step5: { ...s.step5, ...data } })),

        // ── API saves ────────────────────────────────────────────

        saveStep1: async () => {
          const { resumeId, version, step1, currentStep } = get();
          if (!resumeId) return;
          set({ isSaving: true, saveError: null });
          try {
            await api.patch(`/resume/${resumeId}/step/1`, {
              ...step1,
              version,
              currentStep: Math.max(1, currentStep),
            });
            set((s) => ({
              isSaving: false,
              lastSaved: new Date(),
              version: s.version + 1,
            }));
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ?? "Save failed";
            set({ isSaving: false, saveError: msg });
            throw err;
          }
        },

        saveStep2: async () => {
          const { resumeId, version, step2, currentStep } = get();
          if (!resumeId) return;
          set({ isSaving: true, saveError: null });
          try {
            await api.patch(`/resume/${resumeId}/step/2`, {
              ...step2,
              version,
              currentStep: Math.max(2, currentStep),
            });
            set((s) => ({
              isSaving: false,
              lastSaved: new Date(),
              version: s.version + 1,
            }));
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ?? "Save failed";
            set({ isSaving: false, saveError: msg });
            throw err;
          }
        },

        saveStep3: async () => {
          const { resumeId, version, step3, currentStep } = get();
          if (!resumeId) return;
          set({ isSaving: true, saveError: null });
          const projectsToSave = step3.projects.filter(
            (p) =>
              (p.title ?? "").trim() ||
              (p.bullets && p.bullets.some((b) => b.text.trim()))
          );
          try {
            await api.patch(`/resume/${resumeId}/step/3`, {
              skillCategories: step3.skillCategories,
              projects: projectsToSave,
              version,
              currentStep: Math.max(3, currentStep),
            });
            set((s) => ({
              isSaving: false,
              lastSaved: new Date(),
              version: s.version + 1,
            }));
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ?? "Save failed";
            set({ isSaving: false, saveError: msg });
            throw err;
          }
        },

        saveStep4: async () => {
          const { resumeId, version, step4, currentStep } = get();
          if (!resumeId) return;
          set({ isSaving: true, saveError: null });
          try {
            await api.patch(`/resume/${resumeId}/step/4`, {
              internships: step4.internships,
              achievements: step4.achievements,
              version,
              currentStep: Math.max(4, currentStep),
            });
            set((s) => ({
              isSaving: false,
              lastSaved: new Date(),
              version: s.version + 1,
            }));
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ?? "Save failed";
            set({ isSaving: false, saveError: msg });
            throw err;
          }
        },

        saveStep5: async () => {
          const { resumeId, version, step5 } = get();
          if (!resumeId) return;
          set({ isSaving: true, saveError: null });
          try {
            await api.patch(`/resume/${resumeId}/step/5`, {
              summary: step5.summary,
              hobbyItems: step5.hobbyItems,
              version,
            });
            set((s) => ({
              isSaving: false,
              lastSaved: new Date(),
              version: s.version + 1,
              status: "COMPLETED",
              currentStep: 5,
            }));
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ?? "Save failed";
            set({ isSaving: false, saveError: msg });
            throw err;
          }
        },

        saveAllSteps: async () => {
          const { saveStep1, saveStep2, saveStep3, saveStep4, saveStep5 } =
            get();
          await saveStep1();
          await saveStep2();
          await saveStep3();
          await saveStep4();
          await saveStep5();
        },

        // ── Template ─────────────────────────────────────────────

        setTemplate: async (template: TemplateType) => {
          const { resumeId } = get();
          if (!resumeId) return;
          await api.put(`/resume/${resumeId}/template`, { template });
          set({ selectedTemplate: template });
        },

        setTemplateLocal: (template: TemplateType) => {
          set({ selectedTemplate: template });
        },

        // ── Helpers ──────────────────────────────────────────────

        setPhotoUrl: (url) =>
          set((s) => ({ step1: { ...s.step1, photoUrl: url } })),

        setAtsScore: (score) => set({ atsScore: score }),

        setCurrentStep: (step) => set({ currentStep: step }),

        setCustomSections: (sections) => set({ customSections: sections }),
        setEditorStyles: (styles) =>
          set((s) => ({
            editorStyles: { ...s.editorStyles, ...styles },
          })),
        setSectionOrder: (order) => set({ sectionOrder: order }),
        setSectionTitles: (titles) => set({ sectionTitles: titles }),

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prefillFromParsed: (parsed: any) => {
          const step1: Partial<Step1Data> = {};
          if (parsed.fullName) step1.fullName = parsed.fullName;
          if (parsed.phone) step1.phone = parsed.phone;
          if (parsed.contactEmail) step1.contactEmail = parsed.contactEmail;
          if (parsed.city) step1.city = parsed.city;
          if (parsed.state) step1.state = parsed.state;
          if (parsed.linkedin) step1.linkedin = parsed.linkedin;
          if (parsed.github) step1.github = parsed.github;
          if (parsed.portfolio) step1.portfolio = parsed.portfolio;

          const step2: Partial<Step2Data> = {};
          if (parsed.university) step2.university = parsed.university;
          if (parsed.stream) step2.stream = parsed.stream;
          if (parsed.branch) step2.branch = parsed.branch;
          if (parsed.batchStart) step2.batchStart = String(parsed.batchStart);
          if (parsed.batchEnd) step2.batchEnd = String(parsed.batchEnd);
          if (parsed.cgpa) step2.cgpa = String(parsed.cgpa);

          const step3: Partial<Step3Data> = {};
          if (parsed.skillCategories?.length > 0) {
            step3.skillCategories = parsed.skillCategories.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (c: any) => ({
                name: c.name || "General",
                skills: c.skills || [],
              })
            );
          }
          if (parsed.projects?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            step3.projects = parsed.projects.map((p: any) => ({
              title: p.title || "",
              subtitle: "",
              description: "",
              bullets: (p.bullets || []).map((t: string) => ({ text: t })),
              techStack: p.techStack || [],
              liveUrl: "",
              repoUrl: "",
            }));
          }

          const step4: Partial<Step4Data> = {};
          if (parsed.internships?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            step4.internships = parsed.internships.map((i: any) => ({
              company: i.company || "",
              role: i.role || "",
              description: "",
              bullets: (i.bullets || []).map((t: string) => ({ text: t })),
              startDate: i.startDate || "",
              endDate: i.endDate || "",
            }));
          }
          if (parsed.achievements?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            step4.achievements = parsed.achievements.map((a: any) => ({
              title: a.title || "",
              description: a.description || "",
              link: a.link || "",
              type: a.type || "OTHER",
            }));
          }

          const step5: Partial<Step5Data> = {};
          if (parsed.summary) step5.summary = parsed.summary;
          if (parsed.hobbyItems?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            step5.hobbyItems = parsed.hobbyItems.map((h: any) => ({
              name: h.name || "",
              description: h.description || "",
            }));
          }

          set({
            step1: { ...get().step1, ...step1 },
            step2: { ...get().step2, ...step2 },
            step3: { ...get().step3, ...step3 },
            step4: { ...get().step4, ...step4 },
            step5: { ...get().step5, ...step5 },
          });
        },

        reset: () =>
          set({
            resumeId: null,
            currentStep: 1,
            version: 1,
            status: "DRAFT",
            selectedTemplate: null,
            atsScore: null,
            isSaving: false,
            lastSaved: null,
            saveError: null,
            step1: defaultStep1,
            step2: defaultStep2,
            step3: defaultStep3,
            step4: defaultStep4,
            step5: defaultStep5,
          }),
      }),

      {
        name: "chitkara-cv-resume",
        // Don't persist transient save state
        partialize: (s) => ({
          resumeId: s.resumeId,
          currentStep: s.currentStep,
          version: s.version,
          status: s.status,
          selectedTemplate: s.selectedTemplate,
          step1: s.step1,
          step2: s.step2,
          step3: s.step3,
          step4: s.step4,
          step5: s.step5,
        }),
      }
    ),
    { name: "ResumeStore" }
  )
);