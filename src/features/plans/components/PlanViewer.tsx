"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { exercises } from "@/features/wizard/data/exercises";
import { foods } from "@/features/wizard/data/foods";
import { TRANSLATIONS, type TrainingLevel, type TrainingGoal, type WorkoutDay, type MealPlanDay } from "@/features/wizard/types";
import { generateWorkoutPlan } from "@/features/wizard/data/workout-templates";
import { generateMealPlan } from "@/features/wizard/data/meal-templates";
import { TrackingCalendar } from "./TrackingCalendar";
import { ExerciseMediaThumb } from "./ExerciseMediaThumb";
import type { UserPlan, PlanDataWithProgress } from "../types";

type TabType = "resumen" | "rutina" | "alimentacion" | "calendario";

interface PlanViewerProps {
  plan: UserPlan & { isExpired: boolean; daysRemaining: number };
  initialTab?: TabType;
  isPreview?: boolean;
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

// Default filler note emitted by generateWorkoutPlan when an exercise has no
// specific tip; hidden at render to avoid repeating it on every card.
const GENERIC_EXERCISE_NOTE = "Ejecuta con buena tecnica";

export function PlanViewer({ plan, initialTab, isPreview = false }: PlanViewerProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || "resumen");
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(0);
  const [selectedMealDay, setSelectedMealDay] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const planData = plan.planData;
  const hasSubscription = profile?.has_active_subscription ?? false;

  // Generate workout plan based on user selections
  const workoutPlan: WorkoutDay[] = useMemo(() => {
    if (!planData.level || !planData.goal) return [];
    return generateWorkoutPlan(
      planData.level,
      planData.goal,
      planData.selectedExercises,
      planData.time
    );
  }, [planData.level, planData.goal, planData.selectedExercises, planData.time]);

  // Calorie targets (simplified - in real app use the calculateCalories function)
  const calories = useMemo(() => {
    if (!planData.userBodyData) return null;
    const { currentWeight, targetWeight, height, age, gender, activityLevel } = planData.userBodyData;

    // Harris-Benedict BMR
    const bmr = gender === "masculino"
      ? 88.362 + (13.397 * currentWeight) + (4.799 * height) - (5.677 * age)
      : 447.593 + (9.247 * currentWeight) + (3.098 * height) - (4.330 * age);

    const activityMultipliers: Record<string, number> = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      activo: 1.725,
      muy_activo: 1.9,
    };

    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));
    let targetCalories = tdee;

    if (targetWeight < currentWeight) {
      targetCalories = tdee - 500; // Deficit for weight loss
    } else if (targetWeight > currentWeight) {
      targetCalories = tdee + 300; // Surplus for weight gain
    }

    return { bmr: Math.round(bmr), tdee, target: targetCalories };
  }, [planData.userBodyData]);

  // Generate meal plan based on calorie target
  const mealPlan: MealPlanDay[] = useMemo(() => {
    if (!planData.userBodyData || !calories) return [];
    return generateMealPlan(calories.target, planData.userBodyData.weightGoal, 7);
  }, [planData.userBodyData, calories]);

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      // Lazy import: keeps jspdf/qrcode out of the initial bundle
      const { generateWorkoutPDF } = await import("@/features/wizard/utils/generate-pdf");
      await generateWorkoutPDF({ state: planData, exercises, calories });
    } catch (error) {
      console.error("Error generando el PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Get exercise details by ID
  const getExerciseById = (exerciseId: string) => {
    return exercises.find((ex) => ex.id === exerciseId);
  };

  const selectedExercises = exercises.filter((ex) =>
    planData.selectedExercises.includes(ex.id)
  );

  const selectedFoods = foods.filter((food) =>
    planData.selectedFoods.includes(food.id)
  );

  const allTabs: { id: TabType; label: string; icon: string }[] = [
    { id: "resumen", label: "Resumen", icon: "📋" },
    { id: "rutina", label: "Rutina Semanal", icon: "💪" },
    { id: "alimentacion", label: "Plan Alimenticio", icon: "🥗" },
    { id: "calendario", label: "Calendario", icon: "📅" },
  ];

  // Hide calendar tab in preview mode (requires Supabase for progress tracking)
  const tabs = isPreview ? allTabs.filter((t) => t.id !== "calendario") : allTabs;

  // Current workout day details
  const currentWorkout = workoutPlan[selectedWorkoutDay];
  const currentMealDay = mealPlan[selectedMealDay];

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {!isPreview && (
              <button
                type="button"
                onClick={() => router.back()}
                className="text-gray-500 hover:text-white text-sm mb-2 inline-flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {isPreview
                ? "Plan de Ejemplo - JCV Fitness"
                : planData.userName ? `Plan de ${planData.userName}` : "Tu Plan de Entrenamiento"}
            </h1>
          </div>
          {!isPreview && !plan.isExpired && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Tiempo restante</div>
              <div className="text-lg font-bold text-accent-cyan">
                {plan.daysRemaining} dias
              </div>
            </div>
          )}
        </div>

        {/* Status Banner */}
        {!isPreview && !plan.isExpired && plan.daysRemaining <= 7 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-yellow-200">Tu plan vence en {plan.daysRemaining} dias</span>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition-colors"
            >
              Renovar
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-accent-cyan text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* RESUMEN TAB */}
          {activeTab === "resumen" && (
            <>
              {/* Plan Overview */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-bold text-accent-cyan mb-4">Configuracion del Programa</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-300 text-xs mb-1">Nivel</div>
                    <div className="text-white font-medium">
                      {planData.level ? TRANSLATIONS.levels[planData.level] : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-300 text-xs mb-1">Objetivo</div>
                    <div className="text-white font-medium">
                      {planData.goal ? TRANSLATIONS.goals[planData.goal] : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-300 text-xs mb-1">Duracion</div>
                    <div className="text-white font-medium">
                      {planData.duration ? TRANSLATIONS.durations[planData.duration] : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-300 text-xs mb-1">Tiempo/sesion</div>
                    <div className="text-white font-medium">{planData.time} min</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 col-span-2">
                    <div className="text-gray-300 text-xs mb-1">Equipo</div>
                    <div className="text-white font-medium text-sm">
                      {planData.equipment.map((e) => TRANSLATIONS.equipment[e]).join(", ")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Data */}
              {planData.userBodyData && (
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                  <h2 className="text-lg font-bold text-accent-cyan mb-4">Datos Corporales</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{planData.userBodyData.currentWeight}</div>
                      <div className="text-gray-300 text-xs">kg actuales</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent-success">{planData.userBodyData.targetWeight}</div>
                      <div className="text-gray-300 text-xs">kg objetivo</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{planData.userBodyData.height}</div>
                      <div className="text-gray-300 text-xs">cm altura</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{planData.userBodyData.age}</div>
                      <div className="text-gray-300 text-xs">años</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 rounded-xl p-6 border border-accent-cyan/30">
                  <div className="text-3xl font-bold text-accent-cyan">{workoutPlan.filter(d => !d.restDay).length}</div>
                  <div className="text-gray-400 text-sm">Dias de Entreno</div>
                </div>
                <div className="bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 rounded-xl p-6 border border-accent-cyan/30">
                  <div className="text-3xl font-bold text-accent-cyan">{selectedExercises.length}</div>
                  <div className="text-gray-400 text-sm">Ejercicios</div>
                </div>
                <div className="bg-gradient-to-br from-accent-success/20 to-accent-success/5 rounded-xl p-6 border border-accent-success/30">
                  <div className="text-3xl font-bold text-accent-success">{selectedFoods.length}</div>
                  <div className="text-gray-400 text-sm">Alimentos</div>
                </div>
              </div>

              {/* Download CTA / Preview CTA */}
              {isPreview ? (
                <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-success/10 rounded-xl p-6 border border-accent-cyan/30">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Quieres tu plan personalizado?</h3>
                      <p className="text-gray-400 text-sm">
                        Genera el tuyo gratis en 2 minutos con nuestro wizard
                      </p>
                    </div>
                    <Link
                      href="/wizard"
                      className="px-6 py-3 rounded-lg bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/50 transition-all flex items-center gap-2"
                    >
                      Crear Mi Plan Gratis
                    </Link>
                  </div>
                </div>
              ) : !plan.isExpired && (
                <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-success/10 rounded-xl p-6 border border-accent-cyan/30">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Descarga tu plan en PDF</h3>
                      <p className="text-gray-400 text-sm">
                        {hasSubscription
                          ? "Descarga tu plan completo con rutinas detalladas"
                          : "Actualiza a Premium para descargar tu plan"}
                      </p>
                    </div>
                    {hasSubscription ? (
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="px-6 py-3 rounded-lg bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/50 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isGeneratingPdf ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generando PDF...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar PDF
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href="/pricing"
                        className="px-6 py-3 rounded-lg bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/50 transition-all flex items-center gap-2"
                      >
                        Ver Planes Premium
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* RUTINA TAB */}
          {activeTab === "rutina" && (
            <div className="space-y-6">
              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {workoutPlan.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedWorkoutDay(index)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      selectedWorkoutDay === index
                        ? day.restDay
                          ? "bg-gray-600 text-white"
                          : "bg-accent-cyan text-black"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    <div className="text-xs opacity-70">{DAYS_OF_WEEK[index]}</div>
                    <div className="font-semibold">{day.restDay ? "Descanso" : `Dia ${index + 1}`}</div>
                  </button>
                ))}
              </div>

              {/* Current Day Workout */}
              {currentWorkout && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{currentWorkout.name}</h3>
                    {!currentWorkout.restDay && (
                      <div className="flex gap-4 mt-2 text-sm text-gray-400">
                        <span>Duracion: ~{currentWorkout.duration} min</span>
                        <span>Ejercicios: {currentWorkout.exercises.length}</span>
                      </div>
                    )}
                  </div>

                  {currentWorkout.restDay ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">😴</div>
                      <h4 className="text-xl font-bold text-white mb-2">Dia de Descanso</h4>
                      <p className="text-gray-400">
                        El descanso es esencial para la recuperacion muscular. Aprovecha para hacer estiramientos suaves o caminatas.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      {/* Muscle groups */}
                      {currentWorkout.muscleGroups.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {currentWorkout.muscleGroups.map((muscle) => (
                            <span key={muscle} className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan rounded-full text-xs font-medium">
                              {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Exercise List */}
                      <div className="flex flex-col gap-3">
                        {currentWorkout.exercises.map((exercise, idx) => {
                          const exerciseDetails = getExerciseById(exercise.exerciseId);
                          return (
                            <div
                              key={idx}
                              className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                              <div className="flex items-start gap-3 sm:gap-4">
                                <ExerciseMediaThumb
                                  exerciseId={exercise.exerciseId}
                                  emoji={exerciseDetails?.emoji}
                                  name={exerciseDetails?.name}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-white">
                                    {exerciseDetails?.name || exercise.exerciseId}
                                  </h4>
                                  {exerciseDetails?.altName && (
                                    <p className="text-xs text-gray-500 mt-0.5">{exerciseDetails.altName}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2 py-1 bg-white/5 text-foreground/70 ring-1 ring-white/10 rounded text-xs">
                                      <span className="font-bold text-white">{exercise.sets}×</span> series
                                    </span>
                                    <span className="px-2 py-1 bg-white/5 text-foreground/70 ring-1 ring-white/10 rounded text-xs">
                                      <span className="font-bold text-white">{exercise.reps}</span> reps
                                    </span>
                                    <span className="px-2 py-1 bg-white/5 text-foreground/70 ring-1 ring-white/10 rounded text-xs">
                                      <span className="font-bold text-white">{exercise.rest}</span> descanso
                                    </span>
                                  </div>
                                  {exercise.notes && exercise.notes !== GENERIC_EXERCISE_NOTE && (
                                    <p className="text-sm text-gray-400 mt-2 italic">
                                      Tip: {exercise.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {currentWorkout.exercises.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No hay ejercicios asignados para este dia.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ALIMENTACION TAB */}
          {activeTab === "alimentacion" && (
            <div className="space-y-6">
              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mealPlan.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedMealDay(index)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      selectedMealDay === index
                        ? "bg-accent-success text-black"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    <div className="text-xs opacity-70">{DAYS_OF_WEEK[index]}</div>
                    <div className="font-semibold">Dia {index + 1}</div>
                  </button>
                ))}
              </div>

              {/* Current Day Meal Plan */}
              {currentMealDay && (
                <div className="space-y-4">
                  {/* Daily Summary */}
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-white">{DAYS_OF_WEEK[selectedMealDay]} - Resumen Nutricional</h3>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent-success">{currentMealDay.totalCalories}</div>
                          <div className="text-xs text-gray-500">kcal</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400">{currentMealDay.macros.protein}g</div>
                          <div className="text-xs text-gray-500">Proteina</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-yellow-400">{currentMealDay.macros.carbs}g</div>
                          <div className="text-xs text-gray-500">Carbos</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-400">{currentMealDay.macros.fat}g</div>
                          <div className="text-xs text-gray-500">Grasas</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meals */}
                  <div className="grid gap-4">
                    {currentMealDay.meals.map((meal, mealIdx) => (
                      <div key={mealIdx} className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {meal.name === "Desayuno" ? "🌅" :
                               meal.name === "Almuerzo" ? "☀️" :
                               meal.name === "Cena" ? "🌙" : "🥤"}
                            </span>
                            <div>
                              <h4 className="font-semibold text-white">{meal.name}</h4>
                              <span className="text-xs text-gray-500">{meal.time}</span>
                            </div>
                          </div>
                          <div className="text-accent-success font-bold">{meal.calories} kcal</div>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            {meal.foods.map((food, foodIdx) => (
                              <div key={foodIdx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                <div>
                                  <span className="text-white">{food.name}</span>
                                  <span className="text-gray-500 text-sm ml-2">({food.portion})</span>
                                </div>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-gray-400">{food.calories} kcal</span>
                                  <span className="text-blue-400">P:{food.protein}g</span>
                                  <span className="text-yellow-400">C:{food.carbs}g</span>
                                  <span className="text-orange-400">G:{food.fat}g</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mealPlan.length === 0 && (
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
                  <p className="text-gray-500">
                    No se pudo generar el plan alimenticio. Asegurate de completar tus datos corporales.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CALENDARIO TAB */}
          {activeTab === "calendario" && (
            <TrackingCalendar
              planId={plan.id}
              planData={planData as PlanDataWithProgress}
              workoutPlan={workoutPlan}
              planStartDate={plan.createdAt}
              daysRemaining={plan.daysRemaining}
            />
          )}
        </div>
      </div>
    </div>
  );
}
