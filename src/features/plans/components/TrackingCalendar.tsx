"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { progressService, initializePlanProgress } from "../services/progress-service";
import { prefersReducedMotion } from "@/features/shared/utils/reduced-motion";
import type { PlanProgress, DayProgress, PlanDataWithProgress } from "../types";
import type { WorkoutDay } from "@/features/wizard/types";

interface TrackingCalendarProps {
  planId: string;
  planData: PlanDataWithProgress;
  workoutPlan: WorkoutDay[];
  planStartDate: Date;
  daysRemaining: number;
  onProgressUpdate?: (progress: PlanProgress) => void;
}

const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const DAYS_FULL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

/** Completed-workout counts that earn a full-width milestone moment. */
const MILESTONE_LABELS: Record<number, string> = {
  7: "7 DIAS",
  20: "20 DIAS",
  40: "MITAD DEL CAMINO",
};

/** How long the ring + burst celebration stays on a day cell. */
const CELEBRATION_MS = 1600;
/** Milestone overlay auto-dismiss. */
const MILESTONE_MS = 2500;

/** 10 CSS particle offsets, evenly spread around the cell center. */
const PARTICLE_OFFSETS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return {
    x: `${Math.round(Math.cos(angle) * 26)}px`,
    y: `${Math.round(Math.sin(angle) * 26)}px`,
  };
});

function findDayProgress(progress: PlanProgress, date: string): DayProgress | undefined {
  for (const week of progress.weeks) {
    const day = week.days[date];
    if (day) return day;
  }
  return undefined;
}

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingDate, setUpdatingDate] = useState<string | null>(null);
  // Ring-close celebration on the day cell + milestone overlay (#9)
  const [celebratingDate, setCelebratingDate] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss the milestone overlay (also dismissible by tap).
  useEffect(() => {
    if (milestone === null) return;
    const timer = setTimeout(() => setMilestone(null), MILESTONE_MS);
    return () => clearTimeout(timer);
  }, [milestone]);

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    };
  }, []);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Initialize progress on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        if (planData.progress) {
          setProgress(planData.progress);
        } else {
          const durationWeeks = getDurationWeeks(planData.duration);
          const workoutDaysPerWeek = workoutPlan.filter(d => !d.restDay).length;
          const initialProgress = initializePlanProgress(planStartDate, durationWeeks, workoutDaysPerWeek);
          setProgress(initialProgress);

          const updatedProgress = await progressService.initializeProgressIfNeeded(planId, planData);
          setProgress(updatedProgress);
        }
        // Auto-select today
        setSelectedDate(today);
      } catch (error) {
        console.error("[TrackingCalendar] Error initializing:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [planId, planData, planStartDate, workoutPlan, today]);

  // Get day of week (0 = Monday, 6 = Sunday)
  const getDayOfWeekIndex = useCallback((dateStr: string): number => {
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  const isRestDay = useCallback((dateStr: string): boolean => {
    const dayIndex = getDayOfWeekIndex(dateStr);
    return workoutPlan[dayIndex]?.restDay ?? true;
  }, [getDayOfWeekIndex, workoutPlan]);

  const getWorkoutInfo = useCallback((dateStr: string): WorkoutDay | null => {
    const dayIndex = getDayOfWeekIndex(dateStr);
    return workoutPlan[dayIndex] || null;
  }, [getDayOfWeekIndex, workoutPlan]);

  const handleToggleWorkout = async (date: string) => {
    if (updatingDate || isRestDay(date)) return;

    const wasCompleted = progress ? findDayProgress(progress, date)?.workoutCompleted ?? false : false;

    setUpdatingDate(date);
    try {
      const updatedProgress = await progressService.toggleWorkoutCompleted(planId, date);
      if (updatedProgress) {
        setProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);

        const nowCompleted = findDayProgress(updatedProgress, date)?.workoutCompleted ?? false;
        if (nowCompleted && !wasCompleted) {
          celebrateCompletion(date, updatedProgress.stats.totalWorkoutsCompleted);
        }
      }
    } catch (error) {
      console.error("[TrackingCalendar] Error toggling workout:", error);
    } finally {
      setUpdatingDate(null);
    }
  };

  /**
   * Day marked complete: draw a cyan ring around the cell, burst particles and
   * pop the day number; haptic tick on supported devices. At 7/20/40 completed
   * workouts, a full-width milestone moment. Reduced motion keeps only the
   * existing color change (and a static milestone overlay).
   */
  const celebrateCompletion = (date: string, totalCompleted: number) => {
    const reduced = prefersReducedMotion();

    if (!reduced && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50);
    }

    if (!reduced) {
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      setCelebratingDate(date);
      celebrationTimer.current = setTimeout(() => setCelebratingDate(null), CELEBRATION_MS);
    }

    if (MILESTONE_LABELS[totalCompleted]) {
      setMilestone(totalCompleted);
    }
  };

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

  const isFutureDate = (dateStr: string): boolean => dateStr > today;
  const isToday = (dateStr: string): boolean => dateStr === today;

  // Get all days flat for the grid
  const allDays = useMemo(() => {
    if (!progress) return [];
    return progress.weeks.flatMap(week =>
      Object.values(week.days).sort((a, b) => a.date.localeCompare(b.date))
    );
  }, [progress]);

  // Selected day data
  const selectedDayData = useMemo(() => {
    if (!selectedDate || !progress) return null;
    for (const week of progress.weeks) {
      const day = week.days[selectedDate];
      if (day) return day;
    }
    return null;
  }, [selectedDate, progress]);

  const selectedDayWorkout = useMemo(() => {
    if (!selectedDate) return null;
    return getWorkoutInfo(selectedDate);
  }, [selectedDate, getWorkoutInfo]);

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full mb-4" />
          <div className="h-4 bg-gray-700 rounded w-32" />
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
        <p className="text-gray-500">No se pudo cargar el calendario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Milestone moment: full-width overlay, auto-dismiss or tap */}
      {milestone !== null && (
        <button
          type="button"
          onClick={() => setMilestone(null)}
          data-testid="milestone-overlay"
          aria-label="Cerrar celebracion"
          className="milestone-overlay fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-black/85 backdrop-blur-sm cursor-pointer"
        >
          <span className="milestone-text font-display text-6xl sm:text-8xl tracking-widest text-accent-cyan px-6 text-center leading-none">
            {MILESTONE_LABELS[milestone]}
          </span>
          <span className="milestone-text text-gray-300 text-sm uppercase tracking-[0.3em]">
            {milestone === 40 ? "40 entrenos completados" : "Sigue asi"}
          </span>
        </button>
      )}

      {/* Streak Hero Section */}
      <div className="bg-gradient-to-br from-orange-500/20 via-red-500/10 to-yellow-500/20 rounded-2xl p-6 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="text-6xl">
                {progress.stats.currentStreak > 0 ? "🔥" : "💪"}
              </div>
              {progress.stats.currentStreak >= 7 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
                  ⭐
                </div>
              )}
            </div>
            <div>
              <div className="text-4xl font-black text-white">
                {progress.stats.currentStreak}
                <span className="text-lg font-normal text-gray-400 ml-2">
                  {progress.stats.currentStreak === 1 ? "dia" : "dias"}
                </span>
              </div>
              <p className="text-orange-300 font-medium">
                {progress.stats.currentStreak === 0
                  ? "Empieza tu racha hoy!"
                  : progress.stats.currentStreak >= 7
                    ? "Racha increible! Sigue asi!"
                    : "Vas muy bien! No pares!"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Mejor racha</div>
            <div className="text-2xl font-bold text-yellow-400">
              {progress.stats.longestStreak} dias
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-accent-cyan">
            {progress.stats.totalWorkoutsCompleted}
          </div>
          <div className="text-xs text-gray-500">Entrenos</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-accent-cyan">
            {progress.stats.completionRate}%
          </div>
          <div className="text-xs text-gray-500">Completado</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-green-400">
            {progress.currentWeek}/{progress.totalWeeks}
          </div>
          <div className="text-xs text-gray-500">Semana</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-white">
            {daysRemaining}
          </div>
          <div className="text-xs text-gray-500">Restantes</div>
        </div>
      </div>

      {/* Main Content: Calendar Grid + Day Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Tu Progreso</h3>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_SHORT.map((day, i) => (
              <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Compact */}
          <div className="grid grid-cols-7 gap-1">
            {allDays.map((day) => {
              const restDay = isRestDay(day.date);
              const future = isFutureDate(day.date);
              const todayClass = isToday(day.date);
              const isSelected = selectedDate === day.date;
              const isCelebrating = celebratingDate === day.date;
              const dayNum = new Date(day.date + "T12:00:00").getDate();

              // Determine cell style
              let cellStyle = "bg-gray-800/30 border-gray-700/50";
              if (todayClass) {
                cellStyle = "bg-accent-cyan/20 border-accent-cyan ring-2 ring-accent-cyan/30";
              } else if (restDay) {
                cellStyle = "bg-gray-800/20 border-gray-700/30";
              } else if (day.workoutCompleted) {
                cellStyle = "bg-green-500/20 border-green-500/50";
              } else if (!future) {
                cellStyle = "bg-red-500/10 border-red-500/30";
              }

              if (isSelected) {
                cellStyle += " ring-2 ring-white/50";
              }

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`relative aspect-square rounded-lg border transition-all hover:scale-105 ${cellStyle} ${
                    future && !todayClass ? "opacity-40" : ""
                  }`}
                >
                  {/* Date number */}
                  <span className={`absolute top-1 left-1.5 text-[10px] font-medium ${
                    todayClass ? "text-accent-cyan" : "text-gray-400"
                  }`}>
                    {dayNum}
                  </span>

                  {/* Status icon */}
                  <div className="absolute inset-0 flex items-center justify-center pt-2">
                    {restDay ? (
                      <span className="text-gray-600 text-sm">-</span>
                    ) : day.workoutCompleted ? (
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : future ? (
                      <span className="text-gray-600 text-xs">-</span>
                    ) : (
                      <span className="text-red-400/60 text-xs">!</span>
                    )}
                  </div>

                  {/* Meals indicator */}
                  {day.mealsTracked && !restDay && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
                  )}

                  {/* Ring-close celebration: ring draws shut, particles burst, day number pops */}
                  {isCelebrating && (
                    <span
                      className="pointer-events-none absolute inset-0 z-10"
                      data-testid="day-celebration"
                      aria-hidden="true"
                    >
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40" fill="none">
                        <circle
                          cx="20"
                          cy="20"
                          r="17"
                          stroke="var(--accent-cyan)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          pathLength={100}
                          className="celebrate-ring"
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      {PARTICLE_OFFSETS.map((offset, i) => (
                        <span
                          key={i}
                          className="celebrate-particle"
                          style={{ "--burst-x": offset.x, "--burst-y": offset.y } as React.CSSProperties}
                        />
                      ))}
                      <span className="celebrate-pop absolute inset-0 flex items-center justify-center font-display text-xl tracking-wide text-accent-cyan">
                        {dayNum}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
              <span>Completado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-800/30 border border-gray-700/50" />
              <span>Descanso</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span>Comidas</span>
            </div>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
          {selectedDate && selectedDayData ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {DAYS_FULL[getDayOfWeekIndex(selectedDate)]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatFullDate(selectedDate)}
                  </p>
                </div>
                {isToday(selectedDate) && (
                  <span className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan text-xs font-medium rounded-full">
                    HOY
                  </span>
                )}
              </div>

              {isRestDay(selectedDate) ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">😴</div>
                  <h4 className="text-xl font-bold text-white mb-2">Día de Descanso</h4>
                  <p className="text-gray-400 text-sm">
                    Recupera energías para tu próximo entreno.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Workout info */}
                  {selectedDayWorkout && (
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💪</span>
                        <div>
                          <h4 className="font-bold text-white">{selectedDayWorkout.name}</h4>
                          <p className="text-xs text-gray-500">
                            ~{selectedDayWorkout.duration} min | {selectedDayWorkout.exercises.length} ejercicios
                          </p>
                        </div>
                      </div>
                      {selectedDayWorkout.muscleGroups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedDayWorkout.muscleGroups.map(muscle => (
                            <span
                              key={muscle}
                              className="px-2 py-0.5 bg-accent-cyan/20 text-accent-cyan text-xs rounded-full"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleToggleWorkout(selectedDate)}
                      disabled={updatingDate === selectedDate || isFutureDate(selectedDate)}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                        selectedDayData.workoutCompleted
                          ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                          : "bg-accent-cyan hover:bg-accent-cyan/90 text-black"
                      } ${isFutureDate(selectedDate) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {updatingDate === selectedDate ? (
                        <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                      ) : selectedDayData.workoutCompleted ? (
                        <>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Completado!
                        </>
                      ) : (
                        <>Marcar como Completado</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleMeals(selectedDate)}
                      disabled={updatingDate === selectedDate || isFutureDate(selectedDate)}
                      className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        selectedDayData.mealsTracked
                          ? "bg-orange-500/20 border border-orange-500/50 text-orange-400"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                      } ${isFutureDate(selectedDate) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-lg">{selectedDayData.mealsTracked ? "🥗" : "🍽️"}</span>
                      {selectedDayData.mealsTracked ? "Comidas registradas" : "Registrar comidas"}
                    </button>
                  </div>

                  {/* Status message */}
                  {selectedDayData.workoutCompleted && (
                    <div className="text-center py-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <p className="text-green-400 text-sm font-medium">
                        ¡Excelente trabajo! ¡Sigue así! 💪
                      </p>
                    </div>
                  )}

                  {!selectedDayData.workoutCompleted && !isFutureDate(selectedDate) && (
                    <div className="text-center py-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <p className="text-yellow-400 text-sm font-medium">
                        No pierdas tu racha! Entrena hoy.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Selecciona un día para ver detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${date.getDate()} de ${months[date.getMonth()]}`;
}
