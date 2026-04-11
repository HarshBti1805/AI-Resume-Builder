import { useEffect, useRef } from "react";

/**
 * After `ready` (e.g. form loaded from API), debounce-save when `snapshot` changes.
 * Skips the first sync so we don't PATCH immediately on load. Resets when `resumeId` changes.
 */
export function useDebouncedStepPersist(
  ready: boolean,
  resumeId: string | null,
  snapshot: unknown,
  saveFn: () => Promise<void>,
  delayMs = 1200
): void {
  const baseline = useRef<string | null>(null);
  const lastResumeId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !resumeId) {
      baseline.current = null;
      lastResumeId.current = null;
      return;
    }

    if (resumeId !== lastResumeId.current) {
      lastResumeId.current = resumeId;
      baseline.current = null;
    }

    const serialized = JSON.stringify(snapshot);

    if (baseline.current === null) {
      baseline.current = serialized;
      return;
    }

    if (serialized === baseline.current) return;

    const t = setTimeout(() => {
      void saveFn()
        .then(() => {
          baseline.current = serialized;
        })
        .catch(() => {
          // saveError set in store
        });
    }, delayMs);

    return () => clearTimeout(t);
  }, [ready, resumeId, snapshot, saveFn, delayMs]);
}
