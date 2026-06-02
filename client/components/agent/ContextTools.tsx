"use client";

import { useRef, useState } from "react";
import { useAgentStore } from "@/store/agentStore";

/**
 * Context strip above the composer: upload artifacts, paste a job description,
 * and import GitHub projects to ground the agent's suggestions.
 */
export function ContextTools({
  resumeId,
  onSend,
  disabled,
}: {
  resumeId: string;
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const artifacts = useAgentStore((s) => s.artifacts);
  const uploadArtifact = useAgentStore((s) => s.uploadArtifact);
  const addJobDescription = useAgentStore((s) => s.addJobDescription);
  const deleteArtifact = useAgentStore((s) => s.deleteArtifact);

  const [open, setOpen] = useState<null | "jd" | "github">(null);
  const [jd, setJd] = useState("");
  const [github, setGithub] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      await uploadArtifact(resumeId, file);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveJd = async () => {
    if (!jd.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await addJobDescription(resumeId, jd.trim());
      setJd("");
      setOpen(null);
      onSend("Tailor my resume to the job description I just added.");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const importGithub = () => {
    const u = github.trim();
    if (!u) return;
    setOpen(null);
    onSend(
      `Import my best public GitHub projects and add them to my resume. My GitHub username is "${u}".`
    );
  };

  return (
    <div className="border-b border-border/40 bg-muted/20 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || disabled}
          className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-manrope text-xs text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
        >
          <Icon path="M12 4v12m0-12L8 8m4-4 4 4M5 18h14" />
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === "jd" ? null : "jd")}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-manrope text-xs text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
        >
          <Icon path="M8 6h8M8 10h8M8 14h5M5 4h14v16H5z" />
          Job description
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === "github" ? null : "github")}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-manrope text-xs text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
        >
          <Icon path="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.300-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.6-4.6 4.9.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
          GitHub
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {err && (
        <p className="mt-1.5 font-manrope text-[11px] text-red-500">{err}</p>
      )}

      {open === "jd" && (
        <div className="mt-2 space-y-2">
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={4}
            placeholder="Paste the job description here…"
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-manrope text-xs text-foreground outline-none focus:border-primary"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="rounded-lg px-3 py-1.5 font-manrope text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveJd}
              disabled={busy || !jd.trim()}
              className="rounded-lg bg-foreground px-3 py-1.5 font-manrope text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              Save &amp; tailor
            </button>
          </div>
        </div>
      )}

      {open === "github" && (
        <div className="mt-2 flex gap-2">
          <input
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && importGithub()}
            placeholder="your-github-username"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-manrope text-xs text-foreground outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={importGithub}
            disabled={!github.trim()}
            className="shrink-0 rounded-lg bg-foreground px-3 py-1.5 font-manrope text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            Import projects
          </button>
        </div>
      )}

      {artifacts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {artifacts.map((a) => (
            <span
              key={a.id}
              className="inline-flex max-w-[200px] items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 font-manrope text-[11px] text-foreground"
            >
              <span className="font-dm-mono text-[9px] uppercase text-muted-foreground/70">
                {a.kind}
              </span>
              <span className="truncate">{a.label}</span>
              <button
                type="button"
                onClick={() => deleteArtifact(resumeId, a.id)}
                className="text-muted-foreground transition-colors hover:text-red-500"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
