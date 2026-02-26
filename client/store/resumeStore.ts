import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import api from "../lib/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Project {
  id?: string;
  title: string;
  description: string;
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
  startDate?: string;
  endDate?: string;
}

export interface Achievement {
  id?: string;
  title: string;
  description?: string;
  type?: "COMPETITION" | "CERTIFICATION" | "HACKATHON" | "PUBLICATION" | "OTHER";
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
  skills: string[];
  projects: Project[];
}

export interface Step4Data {
  internships: Internship[];
  achievements: Achievement[];
}

export interface Step5Data {
  summary: string;
  hobbies: string[];
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

const defaultStep3: Step3Data = { skills: [], projects: [] };
const defaultStep4: Step4Data = { internships: [], achievements: [] };
const defaultStep5: Step5Data = { summary: "", hobbies: [] };

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
              skills: r.skills ?? [],
              projects: (r.projects ?? []).map((p: Project & { sortOrder?: number }) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                techStack: p.techStack ?? [],
                liveUrl: p.liveUrl ?? "",
                repoUrl: p.repoUrl ?? "",
                startDate: p.startDate
                  ? new Date(p.startDate).toISOString().split("T")[0]
                  : "",
                endDate: p.endDate
                  ? new Date(p.endDate).toISOString().split("T")[0]
                  : "",
              })),
            },
            step4: {
              internships: (r.internships ?? []).map(
                (i: Internship & { sortOrder?: number }) => ({
                  id: i.id,
                  company: i.company,
                  role: i.role,
                  description: i.description ?? "",
                  startDate: i.startDate
                    ? new Date(i.startDate).toISOString().split("T")[0]
                    : "",
                  endDate: i.endDate
                    ? new Date(i.endDate).toISOString().split("T")[0]
                    : "",
                })
              ),
              achievements: (r.achievements ?? []).map(
                (a: Achievement & { sortOrder?: number }) => ({
                  id: a.id,
                  title: a.title,
                  description: a.description ?? "",
                  type: a.type ?? "OTHER",
                })
              ),
            },
            step5: {
              summary: r.summary ?? "",
              hobbies: r.hobbies ?? [],
            },
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
          // Filter out empty projects (no title and no description)
          const projectsToSave = step3.projects.filter(
            (p) => (p.title ?? "").trim() || (p.description ?? "").trim()
          );
          try {
            await api.patch(`/resume/${resumeId}/step/3`, {
              skills: step3.skills,
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
              ...step5,
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