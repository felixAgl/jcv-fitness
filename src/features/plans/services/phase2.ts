import { generateWorkoutPlan } from "@/features/wizard/data/workout-templates";
import type { TrainingLevel, TrainingGoal, WorkoutDay } from "@/features/wizard/types";

/**
 * Fase 2: next 40-day training block with progressed parameters.
 *
 * Progression rule (simple and deterministic, no randomness):
 * 1. If the user is below "avanzado", bump the training level ONE step
 *    (principiante -> basico -> intermedio -> avanzado). The bumped level
 *    drives everything else through the existing LEVEL_CONFIG in
 *    workout-templates.ts: higher sets multiplier, shorter rest and,
 *    where applicable, more training days per week.
 * 2. If the user is already "avanzado" or "elite" (no level to bump to),
 *    keep the level and add +1 set to every COMPOUND exercise instead
 *    (overload on the big lifts is the safest generic progression).
 *
 * Both branches reuse generateWorkoutPlan, so the Fase 2 plan follows the
 * exact same split/exercise selection logic as the original plan.
 */

export const PHASE2_DURATION_DAYS = 40;

/** One-step level progression. "avanzado" and "elite" have no bump. */
const LEVEL_PROGRESSION: Partial<Record<TrainingLevel, TrainingLevel>> = {
  principiante: "basico",
  basico: "intermedio",
  intermedio: "avanzado",
};

/** Multi-joint lifts that receive +1 set when the level cannot be bumped. */
const COMPOUND_EXERCISE_IDS = new Set([
  "sentadilla",
  "sentadilla_bulgara",
  "sentadilla_sumo",
  "peso_muerto",
  "peso_muerto_rumano",
  "press_banca",
  "press_inclinado",
  "press_militar",
  "dominadas",
  "remo_barra",
  "hip_thrust",
  "prensa",
  "zancadas",
  "fondos_pecho",
]);

export interface Phase2Input {
  level: TrainingLevel | null;
  goal: TrainingGoal | null;
  selectedExercises: string[];
  time: number;
}

export interface Phase2Preview {
  /** Level used for the Fase 2 block (possibly bumped). */
  level: TrainingLevel;
  /** True when progression came from a level bump; false when it came from +1 set on compounds. */
  levelBumped: boolean;
  /** The full weekly split for the next block. */
  days: WorkoutDay[];
  /** Length of the block in days. */
  durationDays: number;
}

export function generatePhase2Preview(planData: Phase2Input): Phase2Preview | null {
  if (!planData.level || !planData.goal) return null;

  const nextLevel = LEVEL_PROGRESSION[planData.level];
  const level = nextLevel ?? planData.level;

  const days = generateWorkoutPlan(
    level,
    planData.goal,
    planData.selectedExercises,
    planData.time
  );

  if (!nextLevel) {
    // Already at the top levels: progress via +1 set on compound lifts.
    for (const day of days) {
      for (const exercise of day.exercises) {
        if (COMPOUND_EXERCISE_IDS.has(exercise.exerciseId)) {
          exercise.sets += 1;
        }
      }
    }
  }

  return {
    level,
    levelBumped: Boolean(nextLevel),
    days,
    durationDays: PHASE2_DURATION_DAYS,
  };
}
