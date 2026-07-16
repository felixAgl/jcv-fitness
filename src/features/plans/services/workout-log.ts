import { createClient } from "@/lib/supabase/client";
import type { LoggedSet, PlanDataWithProgress } from "../types";

/**
 * Workout logging with PR detection (idea #10).
 *
 * Persistence follows the progress-service pattern: sets live inside
 * user_plans.plan_data.workoutLog as a flat array of LoggedSet. The array is
 * append-only per date+exercise+setIndex — logging the same set of the same
 * exercise on the same day REPLACES the previous entry (idempotent), anything
 * else appends.
 *
 * Offline tolerance (simple, documented): when a Supabase write fails, the
 * dirty sets are queued in localStorage under `jcv-workout-log-queue:{planId}`.
 * The queue is flushed on the next load of the rutina tab (flushQueuedSets).
 * Queued entries are plain LoggedSets, so replaying them through upsertSet is
 * naturally idempotent.
 */

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested; no Supabase, no DOM)
// ---------------------------------------------------------------------------

/** Key that makes a set unique inside plan_data.workoutLog. */
function setKey(set: Pick<LoggedSet, "date" | "exerciseId" | "setIndex">): string {
  return `${set.date}|${set.exerciseId}|${set.setIndex}`;
}

/**
 * Insert a set into a log. Same date+exercise+setIndex replaces the existing
 * entry (idempotent re-log); otherwise the set is appended. Returns a new
 * array — the input is never mutated.
 */
export function upsertSet(log: LoggedSet[], set: LoggedSet): LoggedSet[] {
  const key = setKey(set);
  const index = log.findIndex((entry) => setKey(entry) === key);
  if (index === -1) return [...log, set];
  const next = [...log];
  next[index] = set;
  return next;
}

/** All logged sets for one exercise, oldest date first (stable within a day). */
export function getLogsForExercise(log: LoggedSet[], exerciseId: string): LoggedSet[] {
  return log
    .filter((entry) => entry.exerciseId === exerciseId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.setIndex - b.setIndex);
}

export interface LastSession {
  date: string;
  sets: LoggedSet[];
}

/**
 * Most recent session (a date with at least one logged set) for an exercise.
 * Pass `excludeDate` (usually today) so the "ultima vez" placeholder shows the
 * PREVIOUS session instead of the sets being logged right now.
 */
export function getLastSessionFor(
  log: LoggedSet[],
  exerciseId: string,
  excludeDate?: string
): LastSession | null {
  const entries = getLogsForExercise(log, exerciseId).filter(
    (entry) => entry.date !== excludeDate
  );
  if (entries.length === 0) return null;
  const date = entries[entries.length - 1].date;
  return { date, sets: entries.filter((entry) => entry.date === date) };
}

/**
 * Estimated one-rep max via the Epley formula: 1RM = weight * (1 + reps / 30).
 * For reps = 1 it degenerates to slightly above the lifted weight, which is
 * fine for trend/PR purposes (we only ever compare Epley against Epley).
 */
export function epley1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export interface PRResult {
  /** True when the candidate set beats max weight and/or max estimated 1RM. */
  isPR: boolean;
  /** Beat the heaviest weight ever logged for the exercise. */
  weightPR: boolean;
  /** Beat the best estimated 1RM (Epley) ever logged for the exercise. */
  e1rmPR: boolean;
  weightKg: number;
  e1rm: number;
}

/**
 * PR detection: a candidate set is a PR when it exceeds the max weight ever
 * logged for that exercise, or the max estimated 1RM (Epley — see epley1RM).
 * The entry the candidate would replace (same date+setIndex) is excluded from
 * the comparison, so correcting a typo cannot count itself as a PR baseline.
 * The very first log of an exercise is NOT a PR (nothing to beat yet).
 */
export function detectPR(log: LoggedSet[], candidate: LoggedSet): PRResult {
  const candidateKey = setKey(candidate);
  const previous = log.filter(
    (entry) => entry.exerciseId === candidate.exerciseId && setKey(entry) !== candidateKey
  );
  const e1rm = epley1RM(candidate.weightKg, candidate.reps);

  if (previous.length === 0) {
    return { isPR: false, weightPR: false, e1rmPR: false, weightKg: candidate.weightKg, e1rm };
  }

  const maxWeight = Math.max(...previous.map((entry) => entry.weightKg));
  const maxE1rm = Math.max(...previous.map((entry) => epley1RM(entry.weightKg, entry.reps)));

  const weightPR = candidate.weightKg > maxWeight;
  const e1rmPR = e1rm > maxE1rm;

  return { isPR: weightPR || e1rmPR, weightPR, e1rmPR, weightKg: candidate.weightKg, e1rm };
}

export interface SessionMax {
  date: string;
  maxWeightKg: number;
}

/**
 * Max weight per session for an exercise, oldest first, capped to the last
 * `limit` sessions. Feeds the "Fuerza" sparkline in ExerciseDetailModal.
 */
export function getSessionMaxes(
  log: LoggedSet[],
  exerciseId: string,
  limit = 8
): SessionMax[] {
  const byDate = new Map<string, number>();
  for (const entry of getLogsForExercise(log, exerciseId)) {
    const current = byDate.get(entry.date);
    if (current === undefined || entry.weightKg > current) {
      byDate.set(entry.date, entry.weightKg);
    }
  }
  return [...byDate.entries()]
    .map(([date, maxWeightKg]) => ({ date, maxWeightKg }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

/**
 * Points string for an SVG <polyline> sparkline (pure — no chart lib). Values
 * are mapped left-to-right; a flat series draws a centered horizontal line.
 * `pad` keeps the stroke inside the viewBox.
 */
export function buildSparklinePoints(
  values: number[],
  width: number,
  height: number,
  pad = 4
): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0;

  return values
    .map((value, i) => {
      const x = values.length > 1 ? pad + i * stepX : width / 2;
      const y = range === 0 ? height / 2 : pad + innerH - ((value - min) / range) * innerH;
      return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// Persistence (Supabase, progress-service pattern) + offline queue
// ---------------------------------------------------------------------------

const QUEUE_KEY_PREFIX = "jcv-workout-log-queue:";

function queueKey(planId: string): string {
  return `${QUEUE_KEY_PREFIX}${planId}`;
}

function readQueue(planId: string): LoggedSet[] {
  try {
    const raw = window.localStorage.getItem(queueKey(planId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoggedSet[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(planId: string, sets: LoggedSet[]): void {
  try {
    if (sets.length === 0) {
      window.localStorage.removeItem(queueKey(planId));
    } else {
      window.localStorage.setItem(queueKey(planId), JSON.stringify(sets));
    }
  } catch {
    // Storage unavailable (private mode): offline tolerance degrades silently.
  }
}

export class WorkoutLogService {
  private getSupabase() {
    const client = createClient();
    if (!client) throw new Error("Supabase client not available");
    return client;
  }

  /**
   * Merge sets into plan_data.workoutLog (fetch -> upsert each -> write).
   * On any failure the sets are queued in localStorage for the next load.
   * Returns the persisted log, or null when the write was queued instead.
   */
  async persistSets(planId: string, sets: LoggedSet[]): Promise<LoggedSet[] | null> {
    if (sets.length === 0) return null;
    try {
      const supabase = this.getSupabase();
      const { data: plan, error: fetchError } = await supabase
        .from("user_plans")
        .select("plan_data")
        .eq("id", planId)
        .single();

      if (fetchError || !plan) throw fetchError ?? new Error("Plan not found");

      const planData = plan.plan_data as PlanDataWithProgress;
      let log = planData.workoutLog ?? [];
      for (const set of sets) {
        log = upsertSet(log, set);
      }
      planData.workoutLog = log;

      const { error: updateError } = await supabase
        .from("user_plans")
        .update({ plan_data: planData })
        .eq("id", planId);

      if (updateError) throw updateError;
      return log;
    } catch (error) {
      console.error("[WorkoutLogService] Persist failed, queueing sets:", error);
      let queued = readQueue(planId);
      for (const set of sets) {
        queued = upsertSet(queued, set);
      }
      writeQueue(planId, queued);
      return null;
    }
  }

  /**
   * Retry sets that failed to persist on a previous visit. Call once when the
   * rutina tab mounts. Clears the queue only after a successful write.
   */
  async flushQueuedSets(planId: string): Promise<LoggedSet[] | null> {
    const queued = readQueue(planId);
    if (queued.length === 0) return null;
    // persistSets re-queues on failure; clear first to avoid double-append.
    writeQueue(planId, []);
    return this.persistSets(planId, queued);
  }
}

export const workoutLogService = new WorkoutLogService();
