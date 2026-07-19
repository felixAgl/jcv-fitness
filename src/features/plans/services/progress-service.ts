import { createClient } from "@/lib/supabase/client";
import type { DayProgress, PlanProgress, WeekProgress, PlanDataWithProgress } from "../types";

// Calculate weeks based on plan duration
function getDurationWeeks(duration: string | null): number {
  const durationMap: Record<string, number> = {
    "1_dia": 1,
    "3_dias": 1,
    "1_semana": 1,
    "2_semanas": 2,
    "1_mes": 4,
    "6_semanas": 6,
    "2_meses": 8,
    "3_meses": 12,
  };
  return durationMap[duration || "1_mes"] || 4;
}

// Initialize progress structure for a plan
export function initializePlanProgress(
  planStartDate: Date,
  durationWeeks: number,
  workoutDaysPerWeek: number
): PlanProgress {
  const weeks: WeekProgress[] = [];

  for (let i = 0; i < durationWeeks; i++) {
    const weekStart = new Date(planStartDate);
    weekStart.setDate(weekStart.getDate() + i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days: Record<string, DayProgress> = {};

    // Initialize all 7 days of the week
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + d);
      const dateKey = dayDate.toISOString().split("T")[0];

      days[dateKey] = {
        date: dateKey,
        workoutCompleted: false,
        mealsTracked: false,
      };
    }

    weeks.push({
      weekNumber: i + 1,
      startDate: weekStart.toISOString().split("T")[0],
      endDate: weekEnd.toISOString().split("T")[0],
      days,
    });
  }

  return {
    totalWeeks: durationWeeks,
    currentWeek: 1,
    weeks,
    stats: {
      totalWorkoutsCompleted: 0,
      totalWorkoutsPlanned: durationWeeks * workoutDaysPerWeek,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
    },
  };
}

// Calculate stats from progress data
function recalculateStats(progress: PlanProgress, workoutDaysPerWeek: number): PlanProgress["stats"] {
  let totalCompleted = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Get all days sorted by date
  const allDays: DayProgress[] = [];
  for (const week of progress.weeks) {
    for (const day of Object.values(week.days)) {
      allDays.push(day);
    }
  }
  allDays.sort((a, b) => a.date.localeCompare(b.date));

  // Count completed and calculate streaks
  for (const day of allDays) {
    if (day.workoutCompleted) {
      totalCompleted++;
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Current streak (from today backwards)
  const today = new Date().toISOString().split("T")[0];
  currentStreak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].date > today) continue;
    if (allDays[i].workoutCompleted) {
      currentStreak++;
    } else {
      break;
    }
  }

  const totalPlanned = progress.totalWeeks * workoutDaysPerWeek;
  const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  return {
    totalWorkoutsCompleted: totalCompleted,
    totalWorkoutsPlanned: totalPlanned,
    currentStreak,
    longestStreak,
    completionRate,
  };
}

// Get current week number based on date
function getCurrentWeekNumber(progress: PlanProgress): number {
  const today = new Date().toISOString().split("T")[0];

  for (const week of progress.weeks) {
    if (today >= week.startDate && today <= week.endDate) {
      return week.weekNumber;
    }
  }

  // If before start, return 1
  if (today < progress.weeks[0]?.startDate) {
    return 1;
  }

  // If after end, return last week
  return progress.totalWeeks;
}

export class ProgressService {
  private getSupabase() {
    const client = createClient();
    if (!client) throw new Error("Supabase client not available");
    return client;
  }

  async updateDayProgress(
    planId: string,
    date: string,
    updates: Partial<DayProgress>
  ): Promise<PlanProgress | null> {
    // Get current plan data
    const { data: plan, error: fetchError } = await this.getSupabase()
      .from("user_plans")
      .select("plan_data")
      .eq("id", planId)
      .single();

    if (fetchError || !plan) {
      console.error("[ProgressService] Error fetching plan:", fetchError);
      return null;
    }

    const planData = plan.plan_data as PlanDataWithProgress;

    // Initialize progress if not exists
    if (!planData.progress) {
      const durationWeeks = getDurationWeeks(planData.duration);
      // Count non-rest days in workout template (assuming 3-5 training days)
      const workoutDaysPerWeek = 4;
      planData.progress = initializePlanProgress(new Date(), durationWeeks, workoutDaysPerWeek);
    }

    // Find and update the specific day
    let dayFound = false;
    for (const week of planData.progress.weeks) {
      if (week.days[date]) {
        week.days[date] = {
          ...week.days[date],
          ...updates,
        };
        dayFound = true;
        break;
      }
    }

    // If day not found in existing weeks, it might be a new day
    if (!dayFound) {
      console.warn("[ProgressService] Day not found in progress weeks:", date);
      return planData.progress;
    }

    // Recalculate stats
    planData.progress.stats = recalculateStats(planData.progress, 4);
    planData.progress.currentWeek = getCurrentWeekNumber(planData.progress);

    // Save updated plan data
    const { error: updateError } = await this.getSupabase()
      .from("user_plans")
      .update({ plan_data: planData })
      .eq("id", planId);

    if (updateError) {
      console.error("[ProgressService] Error updating progress:", updateError);
      return null;
    }

    return planData.progress;
  }

  async toggleWorkoutCompleted(planId: string, date: string): Promise<PlanProgress | null> {
    // Get current status
    const { data: plan, error: fetchError } = await this.getSupabase()
      .from("user_plans")
      .select("plan_data")
      .eq("id", planId)
      .single();

    if (fetchError || !plan) {
      return null;
    }

    const planData = plan.plan_data as PlanDataWithProgress;
    let currentStatus = false;

    if (planData.progress) {
      for (const week of planData.progress.weeks) {
        if (week.days[date]) {
          currentStatus = week.days[date].workoutCompleted;
          break;
        }
      }
    }

    return this.updateDayProgress(planId, date, { workoutCompleted: !currentStatus });
  }

  async toggleMealsTracked(planId: string, date: string): Promise<PlanProgress | null> {
    const { data: plan, error: fetchError } = await this.getSupabase()
      .from("user_plans")
      .select("plan_data")
      .eq("id", planId)
      .single();

    if (fetchError || !plan) {
      return null;
    }

    const planData = plan.plan_data as PlanDataWithProgress;
    let currentStatus = false;

    if (planData.progress) {
      for (const week of planData.progress.weeks) {
        if (week.days[date]) {
          currentStatus = week.days[date].mealsTracked;
          break;
        }
      }
    }

    return this.updateDayProgress(planId, date, { mealsTracked: !currentStatus });
  }

  /**
   * Persist the one-per-plan streak freeze ("congelador") consumption in
   * plan_data.progress, using the same plan_data update mechanism as day
   * progress. Idempotent: once used it is never overwritten.
   */
  async consumeStreakFreeze(planId: string, date: string): Promise<PlanProgress | null> {
    const { data: plan, error: fetchError } = await this.getSupabase()
      .from("user_plans")
      .select("plan_data")
      .eq("id", planId)
      .single();

    if (fetchError || !plan) {
      console.error("[ProgressService] Error fetching plan for streak freeze:", fetchError);
      return null;
    }

    const planData = plan.plan_data as PlanDataWithProgress;
    if (!planData.progress) return null;
    if (planData.progress.streakFreeze?.used) return planData.progress;

    planData.progress.streakFreeze = { used: true, usedOn: date };

    const { error: updateError } = await this.getSupabase()
      .from("user_plans")
      .update({ plan_data: planData })
      .eq("id", planId);

    if (updateError) {
      console.error("[ProgressService] Error persisting streak freeze:", updateError);
      return null;
    }

    return planData.progress;
  }

  async initializeProgressIfNeeded(planId: string, planData: PlanDataWithProgress): Promise<PlanProgress> {
    if (planData.progress) {
      return planData.progress;
    }

    const durationWeeks = getDurationWeeks(planData.duration);
    const workoutDaysPerWeek = 4;
    const progress = initializePlanProgress(new Date(), durationWeeks, workoutDaysPerWeek);

    // Save initialized progress
    const updatedPlanData = { ...planData, progress };

    await this.getSupabase()
      .from("user_plans")
      .update({ plan_data: updatedPlanData })
      .eq("id", planId);

    return progress;
  }
}

export const progressService = new ProgressService();
