import type { BilingualText } from "@/features/exercises";

export type { BilingualText };

export interface Exercise {
  id: string;
  name: BilingualText;
  sets: number;
  /** Rep scheme, e.g. "10-12" or "10-12 c/lado" / "10-12 each side". */
  reps: BilingualText;
  /** Rest time, e.g. "90 seg" / "90 sec". */
  rest: BilingualText;
  notes?: BilingualText;
  videoUrl?: string;
}

export interface WorkoutDay {
  day: number;
  dayName: BilingualText;
  muscleGroup: BilingualText;
  exercises: Exercise[];
  cardio?: CardioSession;
}

export interface CardioSession {
  type: BilingualText;
  /** Language-neutral, e.g. "15 min". */
  duration: string;
  intensity: BilingualText;
  notes?: BilingualText;
}

export interface WorkoutPlan {
  id: string;
  name: BilingualText;
  type: "gym" | "home";
  daysPerWeek: number;
  level: "beginner" | "intermediate" | "advanced";
  days: WorkoutDay[];
}
