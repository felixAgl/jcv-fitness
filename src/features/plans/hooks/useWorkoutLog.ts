"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectPR,
  upsertSet,
  workoutLogService,
  type PRResult,
} from "../services/workout-log";
import type { LoggedSet } from "../types";

/** Debounce window for persisting logged sets (optimistic UI, one write). */
const PERSIST_DEBOUNCE_MS = 800;

/**
 * Client state for workout logging in the rutina tab.
 *
 * - `logSet` is optimistic: local state updates immediately, PR detection runs
 *   against the sets known BEFORE the new one, and persistence is debounced so
 *   rapid per-set taps collapse into a single plan_data write.
 * - Failed writes are queued in localStorage by the service and retried on
 *   the next mount (flushQueuedSets).
 */
export function useWorkoutLog(planId: string, initialLog: LoggedSet[] | undefined, enabled: boolean) {
  const [log, setLog] = useState<LoggedSet[]>(initialLog ?? []);
  // Synchronous mirror of `log`: logSet must detect PRs and return the result
  // in the same tick, and React state updater callbacks are not synchronous.
  const logRef = useRef<LoggedSet[]>(log);
  const pendingRef = useRef<LoggedSet[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retry sets that failed to persist on a previous visit.
  useEffect(() => {
    if (!enabled) return;
    workoutLogService
      .flushQueuedSets(planId)
      .then((persisted) => {
        if (persisted) {
          logRef.current = persisted;
          setLog(persisted);
        }
      })
      .catch(() => {
        // Best-effort retry; the queue survives for the next visit.
      });
  }, [planId, enabled]);

  const flushPending = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = [];
    if (pending.length === 0) return;
    // Fire and forget: on failure the service queues to localStorage.
    workoutLogService.persistSets(planId, pending).catch(() => {});
  }, [planId]);

  // Flush anything still pending when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flushPending();
    };
  }, [flushPending]);

  const logSet = useCallback(
    (set: LoggedSet): PRResult => {
      const pr = detectPR(logRef.current, set);
      logRef.current = upsertSet(logRef.current, set);
      setLog(logRef.current);
      pendingRef.current = upsertSet(pendingRef.current, set);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushPending, PERSIST_DEBOUNCE_MS);
      return pr;
    },
    [flushPending]
  );

  return { log, logSet };
}
