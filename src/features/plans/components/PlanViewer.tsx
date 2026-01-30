"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { exercises } from "@/features/wizard/data/exercises";
import { foods, FOOD_TRANSLATIONS, type FoodCategory } from "@/features/wizard/data/foods";
import { TRANSLATIONS } from "@/features/wizard/types";
import type { UserPlan } from "../types";

type TabType = "resumen" | "ejercicios" | "alimentacion";

interface PlanViewerProps {
  plan: UserPlan & { isExpired: boolean; daysRemaining: number };
}

export function PlanViewer({ plan }: PlanViewerProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("resumen");

  const planData = plan.planData;
  const hasSubscription = profile?.has_active_subscription ?? false;

  const selectedExercises = exercises.filter((ex) =>
    planData.selectedExercises.includes(ex.id)
  );

  const selectedFoods = foods.filter((food) =>
    planData.selectedFoods.includes(food.id)
  );

  const groupedExercises = selectedExercises.reduce(
    (acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise);
      return acc;
    },
    {} as Record<string, typeof selectedExercises>
  );

  const groupedFoods = selectedFoods.reduce(
    (acc, food) => {
      if (!acc[food.category]) {
        acc[food.category] = [];
      }
      acc[food.category].push(food);
      return acc;
    },
    {} as Record<FoodCategory, typeof selectedFoods>
  );

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "resumen", label: "Resumen", icon: "📋" },
    { id: "ejercicios", label: "Ejercicios", icon: "💪" },
    { id: "alimentacion", label: "Alimentacion", icon: "🥗" },
  ];

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm mb-2 inline-flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {planData.userName ? `Plan de ${planData.userName}` : "Tu Plan de Entrenamiento"}
            </h1>
          </div>
          {!plan.isExpired && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Tiempo restante</div>
              <div className="text-lg font-bold text-accent-cyan">
                {plan.daysRemaining} dias
              </div>
            </div>
          )}
        </div>

        {/* Status Banner */}
        {!plan.isExpired && plan.daysRemaining <= 7 && (
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
          {activeTab === "resumen" && (
            <>
              {/* Plan Overview */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-bold text-accent-cyan mb-4">Configuracion del Programa</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Nivel</div>
                    <div className="text-white font-medium">
                      {planData.level ? TRANSLATIONS.levels[planData.level] : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Objetivo</div>
                    <div className="text-white font-medium">
                      {planData.goal ? TRANSLATIONS.goals[planData.goal] : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Duracion</div>
                    <div className="text-white font-medium">
                      {planData.duration ? TRANSLATIONS.durations[planData.duration] : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Tiempo/sesion</div>
                    <div className="text-white font-medium">{planData.time} min</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 col-span-2">
                    <div className="text-gray-500 text-xs mb-1">Equipo</div>
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
                      <div className="text-gray-500 text-xs">kg actuales</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent-green">{planData.userBodyData.targetWeight}</div>
                      <div className="text-gray-500 text-xs">kg objetivo</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{planData.userBodyData.height}</div>
                      <div className="text-gray-500 text-xs">cm altura</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{planData.userBodyData.age}</div>
                      <div className="text-gray-500 text-xs">años</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 rounded-xl p-6 border border-accent-cyan/30">
                  <div className="text-4xl font-bold text-accent-cyan">{selectedExercises.length}</div>
                  <div className="text-gray-400 text-sm">Ejercicios</div>
                </div>
                <div className="bg-gradient-to-br from-accent-green/20 to-accent-green/5 rounded-xl p-6 border border-accent-green/30">
                  <div className="text-4xl font-bold text-accent-green">{selectedFoods.length}</div>
                  <div className="text-gray-400 text-sm">Alimentos</div>
                </div>
              </div>

              {/* Download CTA */}
              {!plan.isExpired && (
                <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-green/10 rounded-xl p-6 border border-accent-cyan/30">
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
                        className="px-6 py-3 rounded-lg bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/50 transition-all flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar PDF
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

          {activeTab === "ejercicios" && (
            <div className="space-y-6">
              {Object.entries(groupedExercises).length > 0 ? (
                Object.entries(groupedExercises).map(([category, exList]) => (
                  <div key={category} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-bold text-accent-cyan mb-4 flex items-center gap-2">
                      {TRANSLATIONS.categories[category as keyof typeof TRANSLATIONS.categories]}
                      <span className="text-sm font-normal text-gray-500">({exList.length})</span>
                    </h3>
                    <div className="grid gap-3">
                      {exList.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-gray-800/50 rounded-lg p-4 flex items-start gap-4"
                        >
                          <span className="text-2xl">{exercise.emoji}</span>
                          <div className="flex-1">
                            <div className="font-medium text-white">{exercise.name}</div>
                            <div className="text-sm text-gray-500">{exercise.altName}</div>
                            <div className="text-xs text-gray-600 mt-1">{exercise.muscle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
                  <p className="text-gray-500">
                    No hay ejercicios seleccionados. Se generara una rutina automatica basada en tu nivel y objetivo.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "alimentacion" && (
            <div className="space-y-6">
              {Object.entries(groupedFoods).length > 0 ? (
                Object.entries(groupedFoods).map(([category, foodList]) => (
                  <div key={category} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-bold text-accent-green mb-4 flex items-center gap-2">
                      {FOOD_TRANSLATIONS[category as FoodCategory]}
                      <span className="text-sm font-normal text-gray-500">({foodList.length})</span>
                    </h3>
                    <div className="grid gap-3">
                      {foodList.map((food) => (
                        <div
                          key={food.id}
                          className="bg-gray-800/50 rounded-lg p-4 flex items-start gap-4"
                        >
                          <span className="text-2xl">{food.emoji}</span>
                          <div className="flex-1">
                            <div className="font-medium text-white">{food.name}</div>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                              <span>{food.calories} kcal</span>
                              <span>P: {food.protein}g</span>
                              <span>C: {food.carbs}g</span>
                              <span>G: {food.fat}g</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
                  <p className="text-gray-500">
                    No hay alimentos seleccionados. Se generara un plan basico con alimentos recomendados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
