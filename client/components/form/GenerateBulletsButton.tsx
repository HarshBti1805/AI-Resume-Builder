"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface GenerateBulletsButtonProps {
  /** Optional tech stack to bias the generated bullets (e.g. project tech tags). */
  techStack?: string[];
  /** Called with the bullet strings the user chose to keep. */
  onAdd: (bullets: string[]) => void;
  /** Short label describing what the bullets are for (placeholder helper). */
  placeholder?: string;
}

export function GenerateBulletsButton({
  techStack = [],
  onAdd,
  placeholder = "Describe what you built and the impact it had…",
}: GenerateBulletsButtonProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bullets, setBullets] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const reset = () => {
    setBullets([]);
    setSelected(new Set());
    setError(null);
  };

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    reset();

    try {
      const res = await fetch(`${API_BASE}/ai/generate-bullets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description, techStack, count }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || "Failed to generate bullets");
      }

      const data = await res.json();
      const generated: string[] = Array.isArray(data.data?.bullets)
        ? data.data.bullets
        : [];
      if (generated.length === 0) {
        throw new Error("No bullets generated — try a richer description.");
      }
      setBullets(generated);
      setSelected(new Set(generated.map((_, i) => i)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate bullets",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const accept = () => {
    const chosen = bullets.filter((_, i) => selected.has(i));
    if (chosen.length === 0) return;
    onAdd(chosen);
    setOpen(false);
    setDescription("");
    reset();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2 font-manrope text-xs font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Generate bullets with AI
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-space-grotesk text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
          AI bullet generator
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          aria-label="Close"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="font-manrope w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {techStack.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="font-dm-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Using:
          </span>
          {techStack.map((t) => (
            <span
              key={t}
              className="rounded-md bg-foreground/[0.07] px-1.5 py-0.5 font-dm-mono text-[10px] text-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <label className="font-manrope text-[11px] text-muted-foreground">
          Bullets
        </label>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="font-manrope rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
        >
          {[3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={loading || !description.trim()}
          className="font-manrope ml-auto inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-all hover:opacity-90 disabled:opacity-40"
        >
          {loading ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-background/30 border-t-background" />
              Generating…
            </>
          ) : bullets.length > 0 ? (
            "Regenerate"
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 font-manrope text-xs text-red-400">{error}</p>
      )}

      <AnimatePresence>
        {bullets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <p className="font-manrope mb-2 text-[11px] text-muted-foreground">
              Pick the ones to add:
            </p>
            <div className="flex flex-col gap-2">
              {bullets.map((b, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-card/40 p-2.5 transition-colors hover:border-primary/40"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="font-manrope text-xs leading-relaxed text-foreground">
                    {b}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={accept}
                disabled={selected.size === 0}
                className="font-manrope rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 disabled:opacity-40"
              >
                Add {selected.size > 0 ? `${selected.size} ` : ""}selected
              </button>
              <button
                type="button"
                onClick={reset}
                className="font-manrope rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
