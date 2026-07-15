"use client";

import Link from "next/link";
import { usePlan } from "../hooks/usePlan";
import { useSubscription } from "@/features/subscription";
import { TRANSLATIONS } from "@/features/wizard/types";

export function PlanStatusCard() {
  const { plan, isLoading, canCreatePlan, canCreateReason } = usePlan();
  const { hasActiveSubscription } = useSubscription();

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
      </div>
    );
  }

  // No plan and can't create (free used)
  if (!plan && !canCreatePlan && canCreateReason === "free_used") {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Plan Expirado</h3>
            <p className="text-sm text-gray-400">Tu periodo gratuito ha terminado</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Actualiza a Premium para seguir accediendo a tu plan y generar nuevos planes ilimitados.
        </p>
        <Link
          href="/pricing"
          className="block w-full py-3 rounded-xl bg-accent-cyan text-black font-bold text-center hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
        >
          Ver Planes Premium
        </Link>
      </div>
    );
  }

  // No plan yet - can create
  if (!plan && canCreatePlan) {
    return (
      <div className="bg-gradient-to-br from-accent-cyan/10 to-accent-success/10 rounded-2xl border border-accent-cyan/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Crea tu primer plan</h3>
            <p className="text-sm text-gray-400">5 semanas gratis de acceso</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Genera tu rutina de entrenamiento y plan alimenticio personalizado en minutos.
        </p>
        <Link
          href="/wizard"
          className="block w-full py-3 rounded-xl bg-accent-cyan text-black font-bold text-center hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
        >
          Comenzar Ahora
        </Link>
      </div>
    );
  }

  // Has active plan
  if (plan) {
    const isExpired = plan.isExpired;
    const daysRemaining = plan.daysRemaining;
    const planData = plan.planData;

    return (
      <div className={`rounded-2xl border p-6 ${
        isExpired
          ? "bg-gray-900 border-red-500/30"
          : daysRemaining <= 7
            ? "bg-gray-900 border-yellow-500/30"
            : "bg-gray-900 border-gray-800"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isExpired
                ? "bg-red-500/10"
                : "bg-accent-cyan/10"
            }`}>
              <svg className={`w-6 h-6 ${isExpired ? "text-red-400" : "text-accent-cyan"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">
                {planData.userName ? `Plan de ${planData.userName}` : "Mi Plan"}
              </h3>
              <p className="text-sm text-gray-400">
                {planData.goal ? TRANSLATIONS.goals[planData.goal] : "Plan personalizado"}
              </p>
            </div>
          </div>
          {!isExpired && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${daysRemaining <= 7 ? "text-yellow-400" : "text-accent-cyan"}`}>
                {daysRemaining}
              </div>
              <div className="text-xs text-gray-500">dias restantes</div>
            </div>
          )}
        </div>

        {isExpired ? (
          <div className="bg-red-500/10 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">
              Tu plan ha expirado. Actualiza para seguir accediendo.
            </p>
          </div>
        ) : daysRemaining <= 7 ? (
          <div className="bg-yellow-500/10 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">
              Tu plan vence pronto. Renueva para no perder acceso.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-white font-semibold">
              {planData.level ? TRANSLATIONS.levels[planData.level].slice(0, 4) : "-"}
            </div>
            <div className="text-gray-300 text-xs">Nivel</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-white font-semibold">{planData.time}min</div>
            <div className="text-gray-300 text-xs">Sesion</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-white font-semibold">
              {planData.duration ? TRANSLATIONS.durations[planData.duration].replace(/\s/g, "") : "-"}
            </div>
            <div className="text-gray-300 text-xs">Duracion</div>
          </div>
        </div>

        <div className="grid gap-2">
          {!isExpired ? (
            <Link
              href="/plan/view"
              className="block w-full py-3 rounded-xl bg-accent-cyan text-black font-bold text-center hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
            >
              Ver Mi Plan
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="block w-full py-3 rounded-xl bg-accent-cyan text-black font-bold text-center hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
            >
              Renovar Plan
            </Link>
          )}

          {hasActiveSubscription && !isExpired && (
            <Link
              href="/wizard"
              className="block w-full py-2 rounded-lg border border-gray-700 text-gray-300 font-medium text-center hover:border-gray-500 hover:text-white transition-all text-sm"
            >
              Crear Nuevo Plan
            </Link>
          )}
        </div>
      </div>
    );
  }

  return null;
}
