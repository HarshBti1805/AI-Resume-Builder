"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface AIButtonProps {
  action: "improve" | "keywords";
  bulletText: string;
  context: string;
  onAccept: (newText: string) => void;
}

export function AIButton({ action, bulletText, context, onAccept }: AIButtonProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  const run = async () => {
    if (!bulletText.trim()) return;
    setLoading(true);
    setPreview(null);
    setKeywords([]);

    try {
      const endpoint =
        action === "improve" ? "/ai/improve-bullet" : "/ai/add-keywords";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bullet: bulletText, context }),
      });
      const data = await res.json();

      if (action === "improve" && data.data?.improved) {
        setPreview(data.data.improved);
      } else if (action === "keywords") {
        setPreview(data.data?.improved ?? bulletText);
        setKeywords(data.data?.addedKeywords ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (preview) {
      onAccept(preview);
      setPreview(null);
      setKeywords([]);
    }
  };

  const dismiss = () => {
    setPreview(null);
    setKeywords([]);
  };

  if (preview) {
    return (
      <div className="mt-1 rounded-md border border-primary/20 bg-primary/[0.03] p-2">
        <p className="font-manrope text-xs text-foreground">{preview}</p>
        {keywords.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-primary/10 px-1.5 py-0.5 font-dm-mono text-[10px] text-primary"
              >
                +{k}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex gap-2">
          <button
            type="button"
            onClick={accept}
            className="rounded bg-foreground px-2 py-0.5 font-manrope text-[10px] font-medium text-background transition-colors hover:opacity-90"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded bg-muted px-2 py-0.5 font-manrope text-[10px] text-muted-foreground transition-colors hover:bg-muted/80"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading || !bulletText.trim()}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-manrope text-[10px] text-primary/60 transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-30"
      title={action === "improve" ? "Improve with AI" : "Add ATS keywords"}
    >
      {loading ? (
        <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-primary/30 border-t-primary" />
      ) : (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {action === "improve" ? "Improve" : "Keywords"}
    </button>
  );
}
