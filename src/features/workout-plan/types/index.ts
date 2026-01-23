export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  videoUrl?: string;
}

export interface WorkoutDay {
  day: number;
  dayName: string;
  muscleGroup: string;
  exercises: Exercise[];
  cardio?: CardioSession;
}

export interface CardioSession {
  type: string;
  duration: string;
  intensity: string;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  type: "gym" | "home";
  daysPerWeek: number;
  level: "beginner" | "intermediate" | "advanced";
  days: WorkoutDay[];
}
