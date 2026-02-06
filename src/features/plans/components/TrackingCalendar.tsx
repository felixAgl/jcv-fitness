"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { progressService, initializePlanProgress } from "../services/progress-service";
import type { PlanProgress, DayProgress, WeekProgress, PlanDataWithProgress } from "../types";
import type { WorkoutDay } from "@/features/wizard/types";

interface TrackingCalendarProps {
  planId: string;
  planData: PlanDataWithProgress;
  workoutPlan: WorkoutDay[];
  planStartDate: Date;
  daysRemaining: number;
  onProgressUpdate?: (progress: PlanProgress) => void;
}

const DAYS_SHORT = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

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

export function TrackingCalendar({
  planId,
  planData,
  workoutPlan,
  planStartDate,
  daysRemaining,
  onProgressUpdate,
}: TrackingCalendarProps) {
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingDate, setUpdatingDate] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Initialize progress on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        if (planData.progress) {
          setProgress(planData.progress);
          setSelectedWeek(planData.progress.currentWeek);
        } else {
          const durationWeeks = getDurationWeeks(planData.duration);
          const workoutDaysPerWeek = workoutPlan.filter(d => !d.restDay).length;
          const initialProgress = initializePlanProgress(planStartDate, durationWeeks, workoutDaysPerWeek);
          setProgress(initialProgress);
          setSelectedWeek(1);

          // Save to database
          const updatedProgress = await progressService.initializeProgressIfNeeded(planId, planData);
          setProgress(updatedProgress);
        }
      } catch (error) {
        console.error("[TrackingCalendar] Error initializing:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [planId, planData, planStartDate, workoutPlan]);

  // Get day of week (0 = Monday, 6 = Sunday)
  const getDayOfWeekIndex = useCallback((dateStr: string): number => {
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday-based
  }, []);

  // Check if it's a rest day based on workout plan
  const isRestDay = useCallback((dateStr: string): boolean => {
    const dayIndex = getDayOfWeekIndex(dateStr);
    return workoutPlan[dayIndex]?.restDay ?? true;
  }, [getDayOfWeekIndex, workoutPlan]);

  // Get workout info for a specific day
  const getWorkoutInfo = useCallback((dateStr: string): WorkoutDay | null => {
    const dayIndex = getDayOfWeekIndex(dateStr);
    return workoutPlan[dayIndex] || null;
  }, [getDayOfWeekIndex, workoutPlan]);

  // Toggle workout completion
  const handleToggleWorkout = async (date: string) => {
    if (updatingDate || isRestDay(date)) return;

    setUpdatingDate(date);
    try {
      const updatedProgress = await progressService.toggleWorkoutCompleted(planId, date);
      if (updatedProgress) {
        setProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);
      }
    } catch (error) {
      console.error("[TrackingCalendar] Error toggling workout:", error);
    } finally {
      setUpdatingDate(null);
    }
  };

  // Toggle meals tracking
  const handleToggleMeals = async (date: string) => {
    if (updatingDate) return;

    setUpdatingDate(date);
    try {
      const updatedProgress = await progressService.toggleMealsTracked(planId, date);
      if (updatedProgress) {
        setProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);
      }
    } catch (error) {
      console.error("[TrackingCalendar] Error toggling meals:", error);
    } finally {
      setUpdatingDate(null);
    }
  };

  const currentWeekData = useMemo(() => {
    if (!progress) return null;
    return progress.weeks.find(w => w.weekNumber === selectedWeek) || null;
  }, [progress, selectedWeek]);

  // Check if date is in the future
  const isFutureDate = (dateStr: string): boolean => {
    return dateStr > today;
  };

  // Check if date is today
  const isToday = (dateStr: string): boolean => {
    return dateStr === today;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 bg-gray-700 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
        <p className="text-gray-500">No se pudo cargar el calendario de progreso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 rounded-xl p-4 border border-accent-cyan/30 text-center">
          <div className="text-2xl md:text-3xl font-bold text-accent-cyan">
            {progress.stats.totalWorkoutsCompleted}
          </div>
          <div className="text-xs text-gray-400">Entrenamientos</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-4 border border-green-500/30 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-400">
            {progress.stats.currentStreak}
          </div>
          <div className="text-xs text-gray-400">Racha actual</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl p-4 border border-orange-500/30 text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-400">
            {progress.stats.longestStreak}
          </div>
          <div className="text-xs text-gray-400">Mejor racha</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/30 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-400">
            {progress.stats.completionRate}%
          </div>
          <div className="text-xs text-gray-400">Completado</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/30 text-center col-span-2 md:col-span-1">
          <div className="text-2xl md:text-3xl font-bold text-blue-400">
            {daysRemaining}
          </div>
          <div className="text-xs text-gray-400">Dias restantes</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progreso del programa</span>
          <span className="text-sm text-accent-cyan font-medium">
            Semana {selectedWeek} de {progress.totalWeeks}
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-cyan to-accent-green transition-all duration-500"
            style={{ width: `${(selectedWeek / progress.totalWeeks) * 100}%` }}
          />
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Seleccionar Semana</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {progress.weeks.map((week) => {
            const weekCompleted = Object.values(week.days).filter(d => d.workoutCompleted).length;
            const weekWorkouts = Object.values(week.days).filter(d => !isRestDay(d.date)).length;
            const isCurrentWeek = week.weekNumber === progress.currentWeek;

            return (
              <button
                key={week.weekNumber}
                type="button"
                onClick={() => setSelectedWeek(week.weekNumber)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium text-sm transition-all min-w-[100px] ${
                  selectedWeek === week.weekNumber
                    ? "bg-accent-cyan text-black"
                    : isCurrentWeek
                      ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <div className="text-xs opacity-70">Semana {week.weekNumber}</div>
                <div className="font-semibold">{weekCompleted}/{weekWorkouts}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid */}
      {currentWeekData && (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Semana {selectedWeek}
            </h3>
            <span className="text-sm text-gray-500">
              {formatDateRange(currentWeekData.startDate, currentWeekData.endDate)}
            </span>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_SHORT.map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {Object.values(currentWeekData.days)
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day) => {
                const workout = getWorkoutInfo(day.date);
                const restDay = isRestDay(day.date);
                const future = isFutureDate(day.date);
                const todayClass = isToday(day.date);
                const isUpdating = updatingDate === day.date;

                return (
                  <div
                    key={day.date}
                    className={`relative rounded-xl p-3 border transition-all ${
                      todayClass
                        ? "border-accent-cyan ring-2 ring-accent-cyan/30"
                        : restDay
                          ? "border-gray-700 bg-gray-800/30"
                          : day.workoutCompleted
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                    } ${future && !todayClass ? "opacity-50" : ""}`}
                  >
                    {/* Date */}
                    <div className="text-center mb-2">
                      <span className={`text-sm font-medium ${todayClass ? "text-accent-cyan" : "text-gray-400"}`}>
                        {new Date(day.date + "T12:00:00").getDate()}
                      </span>
                      {todayClass && (
                        <span className="ml-1 text-[10px] text-accent-cyan">HOY</span>
                      )}
                    </div>

                    {/* Workout Status */}
                    {restDay ? (
                      <div className="text-center">
                        <span className="text-2xl">~</span>
                        <p className="text-[10px] text-gray-500 mt-1">Descanso</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Workout Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleWorkout(day.date)}
                          disabled={isUpdating || future}
                          className={`w-full py-2 rounded-lg text-center transition-all ${
                            day.workoutCompleted
                              ? "bg-green-500/20 border border-green-500/50"
                              : "bg-gray-700/50 border border-gray-600 hover:border-accent-cyan/50"
                          } ${isUpdating ? "opacity-50" : ""} ${future ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {isUpdating ? (
                            <span className="animate-spin inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                          ) : day.workoutCompleted ? (
                            <svg className="w-5 h-5 mx-auto text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-xl">&#128170;</span>
                          )}
                        </button>

                        {/* Meals Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleMeals(day.date)}
                          disabled={isUpdating || future}
                          className={`w-full py-1 rounded text-[10px] transition-all ${
                            day.mealsTracked
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-gray-700/30 text-gray-500 hover:text-gray-300"
                          } ${future ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {day.mealsTracked ? "Comidas OK" : "Comidas"}
                        </button>
                      </div>
                    )}

                    {/* Workout Name (mini) */}
                    {workout && !restDay && (
                      <p className="text-[9px] text-gray-500 text-center mt-1 truncate" title={workout.name}>
                        {workout.muscleGroups[0] || "Entrenamiento"}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Week Details */}
      {currentWeekData && (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Detalle de la Semana</h3>
          <div className="space-y-2">
            {Object.values(currentWeekData.days)
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day, index) => {
                const workout = getWorkoutInfo(day.date);
                const restDay = isRestDay(day.date);

                return (
                  <div
                    key={day.date}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      restDay ? "bg-gray-800/30" : "bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-12">{DAYS_SHORT[index]}</span>
                      <span className="text-gray-400 text-sm w-16">
                        {formatShortDate(day.date)}
                      </span>
                      <span className={`font-medium ${restDay ? "text-gray-500" : "text-white"}`}>
                        {workout?.name || (restDay ? "Descanso" : "Sin entreno")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!restDay && (
                        <>
                          {day.workoutCompleted ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              Completado
                            </span>
                          ) : isFutureDate(day.date) ? (
                            <span className="px-2 py-1 bg-gray-700 text-gray-500 rounded text-xs">
                              Pendiente
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                              Sin completar
                            </span>
                          )}
                          {day.mealsTracked && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                              Comidas
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const month = MONTHS[startDate.getMonth()];

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay} - ${endDay} ${month}`;
  }

  return `${startDay} ${MONTHS[startDate.getMonth()]} - ${endDay} ${MONTHS[endDate.getMonth()]}`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return `${date.getDate()}/${date.getMonth() + 1}`;
}
