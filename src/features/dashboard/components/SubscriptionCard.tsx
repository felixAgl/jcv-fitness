"use client";

import { useSubscription, SUBSCRIPTION_PLANS } from "@/features/subscription";

export function SubscriptionCard() {
  const { subscription, hasActiveSubscription, daysRemaining, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
      </div>
    );
  }

  if (!hasActiveSubscription || !subscription) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sin suscripcion activa</h3>
            <p className="text-gray-400 text-sm">Activa tu plan para acceder al contenido</p>
          </div>
        </div>
        <a
          href="/pricing"
          className="block w-full py-3 rounded-xl bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold text-center transition-colors"
        >
          Ver planes
        </a>
      </div>
    );
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.plan_type);
  const endDate = new Date(subscription.end_date);
  const isExpiringSoon = daysRemaining <= 7;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent-cyan/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{plan?.name || "Plan Activo"}</h3>
            <p className="text-accent-cyan text-sm font-medium">Suscripcion activa</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
          Activo
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Vence:</span>
          <span className={`font-medium ${isExpiringSoon ? "text-orange-400" : "text-white"}`}>
            {endDate.toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Dias restantes:</span>
          <span className={`font-bold ${isExpiringSoon ? "text-orange-400" : "text-accent-cyan"}`}>
            {daysRemaining} dias
          </span>
        </div>

        {isExpiringSoon && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <p className="text-orange-400 text-sm">
              Tu suscripcion esta por vencer. Renueva para no perder acceso.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-800">
          <a
            href="/pricing"
            className="block w-full py-2 rounded-xl border border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-black font-medium text-center transition-colors text-sm"
          >
            {isExpiringSoon ? "Renovar ahora" : "Cambiar plan"}
          </a>
        </div>
      </div>
    </div>
  );
}
