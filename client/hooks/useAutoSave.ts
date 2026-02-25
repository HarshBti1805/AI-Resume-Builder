import { useEffect, useRef } from "react";
import { useResumeStore } from "../store/resumeStore";

/**
 * Debounced auto-save hook.
 *
 * Usage:
 *   const { step1, saveStep1 } = useResumeStore();
 *   useAutoSave(saveStep1, [step1], 3000);
 *
 * @param saveFn   - The save function from resumeStore (e.g. saveStep1)
 * @param deps     - Values to watch; when any change, the timer resets
 * @param delay    - Debounce ms (default 3 000)
 */
export function useAutoSave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  delay = 3000
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skip the very first render — don't auto-save default empty values
  const isFirstRender = useRef(true);
  const resumeId = useResumeStore((s) => s.resumeId);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // No resume yet — nothing to save
    if (!resumeId) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        await saveFn();
      } catch {
        // saveError is set inside the store; component can read it via selector
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, resumeId]);
}