import { create } from "zustand";
import { tokenStore } from "@/lib/api";
import { useResumeStore } from "@/store/resumeStore";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface AgentToolEvent {
  tool: string;
  label: string;
  snapshotId: string | null;
  status?: "running" | "done";
}

export interface AgentChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolEvents?: AgentToolEvent[];
  streaming?: boolean;
}

export interface Snapshot {
  id: string;
  version: number;
  label: string | null;
  source: string;
  createdAt: string;
}

export interface Artifact {
  id: string;
  kind: "FILE" | "JD";
  label: string | null;
  mimeType?: string | null;
  createdAt: string;
}

interface AgentState {
  messages: AgentChatMessage[];
  snapshots: Snapshot[];
  artifacts: Artifact[];
  streaming: boolean;
  error: string | null;

  loadConversation: (resumeId: string) => Promise<void>;
  loadSnapshots: (resumeId: string) => Promise<void>;
  loadArtifacts: (resumeId: string) => Promise<void>;
  sendMessage: (resumeId: string, message: string) => Promise<void>;
  undoLast: (resumeId: string) => Promise<void>;
  restoreSnapshot: (resumeId: string, snapshotId: string) => Promise<void>;
  uploadArtifact: (resumeId: string, file: File) => Promise<void>;
  addJobDescription: (
    resumeId: string,
    text: string,
    label?: string
  ) => Promise<void>;
  deleteArtifact: (resumeId: string, artifactId: string) => Promise<void>;
  reset: () => void;
}

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = tokenStore.getAccess();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

const uid = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  snapshots: [],
  artifacts: [],
  streaming: false,
  error: null,

  reset: () =>
    set({ messages: [], snapshots: [], artifacts: [], error: null }),

  loadConversation: async (resumeId) => {
    try {
      const res = await fetch(
        `${API_BASE}/agent/${resumeId}/conversation`,
        { headers: authHeaders(), credentials: "include" }
      );
      if (!res.ok) return;
      const json = await res.json();
      const messages: AgentChatMessage[] = (
        json.data?.messages ?? []
      ).map(
        (m: {
          id: string;
          role: string;
          content: string;
          toolEvents?: AgentToolEvent[] | null;
        }) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          toolEvents: m.toolEvents ?? undefined,
        })
      );
      set({ messages });
    } catch {
      /* non-fatal */
    }
  },

  loadSnapshots: async (resumeId) => {
    try {
      const res = await fetch(`${API_BASE}/agent/${resumeId}/snapshots`, {
        headers: authHeaders(),
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      set({ snapshots: json.data?.snapshots ?? [] });
    } catch {
      /* non-fatal */
    }
  },

  loadArtifacts: async (resumeId) => {
    try {
      const res = await fetch(`${API_BASE}/agent/${resumeId}/artifacts`, {
        headers: authHeaders(),
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      set({ artifacts: json.data?.artifacts ?? [] });
    } catch {
      /* non-fatal */
    }
  },

  sendMessage: async (resumeId, message) => {
    const trimmed = message.trim();
    if (!trimmed || get().streaming) return;

    const userMsg: AgentChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
    };
    const assistantId = uid();
    const assistantMsg: AgentChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolEvents: [],
      streaming: true,
    };

    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      streaming: true,
      error: null,
    }));

    const patchAssistant = (fn: (m: AgentChatMessage) => AgentChatMessage) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantId ? fn(m) : m
        ),
      }));

    let resumeChanged = false;

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ resumeId, message: trimmed }),
      });

      if (!res.ok || !res.body) {
        let msg = "The assistant is unavailable right now.";
        try {
          const j = await res.json();
          msg = j?.error?.message ?? msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue; // skip ping comments
          const json = line.slice("data: ".length);
          let evt: {
            type: string;
            delta?: string;
            event?: AgentToolEvent;
            message?: string;
          };
          try {
            evt = JSON.parse(json);
          } catch {
            continue;
          }

          if (evt.type === "text" && evt.delta) {
            patchAssistant((m) => ({
              ...m,
              content: m.content + evt.delta,
            }));
          } else if (evt.type === "tool" && evt.event) {
            const event = evt.event;
            patchAssistant((m) => {
              const events = [...(m.toolEvents ?? [])];
              if (event.status === "running") {
                events.push({ ...event });
              } else {
                // mark the most recent running step of this tool as done
                for (let i = events.length - 1; i >= 0; i--) {
                  if (
                    events[i].tool === event.tool &&
                    events[i].status === "running"
                  ) {
                    events[i] = { ...event, status: "done" };
                    return { ...m, toolEvents: events };
                  }
                }
                events.push({ ...event, status: "done" });
              }
              return { ...m, toolEvents: events };
            });
          } else if (evt.type === "resume_updated") {
            resumeChanged = true;
            // Refresh the live preview immediately as edits land.
            useResumeStore
              .getState()
              .loadResume(resumeId)
              .catch(() => {});
          } else if (evt.type === "error") {
            patchAssistant((m) => ({
              ...m,
              content:
                m.content ||
                evt.message ||
                "Something went wrong. Please try again.",
            }));
            set({ error: evt.message ?? "Agent error" });
          }
        }
      }
    } catch (err) {
      patchAssistant((m) => ({
        ...m,
        content:
          m.content ||
          (err instanceof Error ? err.message : "Something went wrong."),
      }));
      set({ error: err instanceof Error ? err.message : "Agent error" });
    } finally {
      patchAssistant((m) => ({ ...m, streaming: false }));
      set({ streaming: false });
      if (resumeChanged) {
        await get().loadSnapshots(resumeId);
        await useResumeStore.getState().loadResume(resumeId).catch(() => {});
      }
    }
  },

  undoLast: async (resumeId) => {
    const res = await fetch(`${API_BASE}/agent/${resumeId}/undo`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });
    if (!res.ok) return;
    await useResumeStore.getState().loadResume(resumeId).catch(() => {});
    await get().loadSnapshots(resumeId);
  },

  restoreSnapshot: async (resumeId, snapshotId) => {
    const res = await fetch(
      `${API_BASE}/agent/snapshots/${snapshotId}/restore`,
      {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
      }
    );
    if (!res.ok) return;
    await useResumeStore.getState().loadResume(resumeId).catch(() => {});
    await get().loadSnapshots(resumeId);
  },

  uploadArtifact: async (resumeId, file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/agent/${resumeId}/artifacts`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      let msg = "Upload failed.";
      try {
        const j = await res.json();
        msg = j?.error?.message ?? msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    await get().loadArtifacts(resumeId);
  },

  addJobDescription: async (resumeId, text, label) => {
    const res = await fetch(
      `${API_BASE}/agent/${resumeId}/job-description`,
      {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ text, label }),
      }
    );
    if (!res.ok) throw new Error("Could not save job description.");
    await get().loadArtifacts(resumeId);
  },

  deleteArtifact: async (resumeId, artifactId) => {
    const res = await fetch(
      `${API_BASE}/agent/${resumeId}/artifacts/${artifactId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      }
    );
    if (!res.ok) return;
    await get().loadArtifacts(resumeId);
  },
}));
