import type { WizardState } from "@/features/wizard/types";

export type PlanType = "free" | "paid";

export type PlanStatus = "active" | "expired";

// Progress tracking types
export interface DayProgress {
  date: string; // ISO date string YYYY-MM-DD
  workoutCompleted: boolean;
  mealsTracked: boolean;
  notes?: string;
  exercisesCompleted?: string[]; // IDs of exercises completed
  rating?: 1 | 2 | 3 | 4 | 5; // How did you feel?
}

export interface WeekProgress {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: Record<string, DayProgress>; // key is YYYY-MM-DD
}

/** Racha 40 freeze: one per plan, persisted so it is never granted twice. */
export interface StreakFreeze {
  used: boolean;
  /** YYYY-MM-DD of the missed day the freeze covered. */
  usedOn: string;
}

export interface PlanProgress {
  totalWeeks: number;
  currentWeek: number;
  weeks: WeekProgress[];
  /** Optional: absent on plans created before Racha 40 shipped. */
  streakFreeze?: StreakFreeze;
  stats: {
    totalWorkoutsCompleted: number;
    totalWorkoutsPlanned: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  };
}

/**
 * One logged working set for an exercise. Persisted under
 * plan_data.workoutLog as a flat append-only array; a set is uniquely
 * identified by date + exerciseId + setIndex (re-logging the same set on the
 * same day replaces the entry instead of duplicating it).
 */
export interface LoggedSet {
  /** YYYY-MM-DD */
  date: string;
  exerciseId: string;
  /** 0-based index within the day's planned sets. */
  setIndex: number;
  reps: number;
  weightKg: number;
}

export interface PlanDataWithProgress extends WizardState {
  progress?: PlanProgress;
  /** Workout logging (idea #10). Absent on plans created before it shipped. */
  workoutLog?: LoggedSet[];
}

export interface UserPlan {
  id: string;
  userId: string;
  planData: PlanDataWithProgress;
  planType: PlanType;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  downloadCount: number;
  updatedAt: Date;
}

export interface UserPlanRow {
  id: string;
  user_id: string;
  plan_data: PlanDataWithProgress;
  plan_type: PlanType;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  download_count: number;
  updated_at: string;
}

export interface ActivePlanResult {
  id: string;
  plan_data: PlanDataWithProgress;
  plan_type: PlanType;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  days_remaining: number;
  download_count: number;
}

export interface CanCreatePlanResult {
  can_create: boolean;
  reason: "already_has_plan" | "free_used" | null;
}

export function mapRowToUserPlan(row: UserPlanRow): UserPlan {
  return {
    id: row.id,
    userId: row.user_id,
    planData: row.plan_data,
    planType: row.plan_type,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    isActive: row.is_active,
    downloadCount: row.download_count,
    updatedAt: new Date(row.updated_at),
  };
}

export function mapActivePlanResult(row: ActivePlanResult): UserPlan & {
  isExpired: boolean;
  daysRemaining: number;
} {
  return {
    id: row.id,
    userId: "", // Not returned from function
    planData: row.plan_data,
    planType: row.plan_type,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    isActive: !row.is_expired,
    downloadCount: row.download_count,
    updatedAt: new Date(row.created_at), // Same as created for active
    isExpired: row.is_expired,
    daysRemaining: row.days_remaining,
  };
}
