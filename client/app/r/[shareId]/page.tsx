"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/** A4 width at 96 DPI — matches the builder's preview/PDF layout width. */
const A4_W = 794;
const A4_H = 1123;

export default function PublicResumePage() {
  const params = useParams<{ shareId: string }>();
  const shareId = params?.shareId;

  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [contentH, setContentH] = useState(A4_H);
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/public/resume/${shareId}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "This resume is private or the link is no longer valid."
              : "Could not load this resume.",
          );
        }
        const text = await res.text();
        if (!cancelled) setHtml(text);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load resume.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc?.body) {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        setContentH(Math.max(h, A4_H));
      }
    } catch {
      // same-origin only
    }
  }, []);

  useEffect(() => {
    if (loading || error || !html) return;
    const el = frameWrapRef.current;
    if (!el) return;

    const update = (width: number) => {
      if (width <= 0) return;
      setScale(Math.min(width / A4_W, 1));
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.contentRect.width);
    });
    ro.observe(el);
    update(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [loading, error, html]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-akrobat text-lg font-bold tracking-wider text-foreground/70 transition-opacity hover:opacity-80"
        >
          ChitkaraCV
        </Link>
        <span className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Shared resume
        </span>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
            <p className="font-manrope text-sm text-muted-foreground">
              Loading resume…
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 px-6 py-16 text-center">
            <p className="font-space-grotesk text-base font-semibold text-foreground">
              Not available
            </p>
            <p className="font-manrope mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {error}
            </p>
            <Link
              href="/"
              className="font-manrope mt-6 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Go to ChitkaraCV
            </Link>
          </div>
        ) : (
          <>
            <div
              className="mx-auto w-full overflow-hidden rounded-2xl border border-border/60 bg-white shadow-lg"
              style={{ maxWidth: A4_W }}
            >
              <div ref={frameWrapRef} className="flex w-full justify-center bg-white">
                <div
                  className="overflow-hidden"
                  style={{ width: A4_W * scale, height: contentH * scale }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    title="Shared resume"
                    className="block border-0 bg-white"
                    sandbox="allow-same-origin"
                    onLoad={measure}
                    style={{
                      width: A4_W,
                      height: contentH,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-6 text-center font-manrope text-xs text-muted-foreground">
              Made with{" "}
              <Link
                href="/"
                className="font-medium text-foreground/80 underline underline-offset-2 hover:text-foreground"
              >
                ChitkaraCV
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
