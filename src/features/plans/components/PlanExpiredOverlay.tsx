"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { CheckoutModal } from "@/features/payment/components/CheckoutModal";
import { SUBSCRIPTION_PLANS } from "@/features/subscription";
import { track } from "@/features/shared/analytics/track";

/** Renewal reuses the existing PLAN_BASICO tier (worker maps 49900 -> 40 days). */
const RENEWAL_PLAN_ID = "PLAN_BASICO" as const;

export function PlanExpiredOverlay() {
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const renewalPlan = SUBSCRIPTION_PLANS.find((p) => p.id === RENEWAL_PLAN_ID);

  const handleFase2 = () => {
    track("checkout_click", undefined, "fase2");
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:py-8">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full my-auto p-8 shadow-2xl text-center">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Tu plan ha expirado
        </h2>

        <p className="text-gray-400 mb-6">
          Tu período de prueba gratuito de 5 semanas ha terminado. Actualiza a Premium para seguir accediendo a tu plan, descargar PDFs y obtener soporte personalizado.
        </p>

        <div className="space-y-4">
          {/* Fase 2 renewal CTA */}
          <div className="bg-gradient-to-br from-accent-cyan/15 to-gray-800/60 rounded-xl p-5 border border-accent-cyan/40 text-center">
            <h3 className="font-display text-3xl tracking-wide text-white leading-none mb-1">
              TU FASE 2 ESTA LISTA
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Los proximos 40 dias con progresion, generados con tu mismo perfil.
            </p>
            <div className="font-display text-3xl tracking-wide text-accent-cyan leading-none">
              {renewalPlan?.priceDisplay}
            </div>
            <div className="text-xs text-gray-400 mb-4">Precio cliente que renueva</div>
            <button
              type="button"
              onClick={handleFase2}
              className="block w-full py-4 rounded-xl font-bold bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
            >
              Desbloquear Fase 2
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 text-left">
            <h3 className="font-bold text-accent-cyan mb-3">Con Premium obtendrás:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Acceso ilimitado a tu plan
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Descarga de PDF con rutinas detalladas
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Videos explicativos de cada ejercicio
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Soporte personalizado por WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Genera planes ilimitados
              </li>
            </ul>
          </div>

          <Link
            href="/pricing"
            className="block w-full py-3 rounded-xl font-semibold border border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/10 transition-all"
          >
            Ver Planes Premium
          </Link>

          <Link
            href="/dashboard"
            className="block w-full py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>

      {/* z-[100]: renders above this overlay (z-50) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={RENEWAL_PLAN_ID}
        customerEmail={user?.email}
        userId={user?.id}
      />
    </div>
  );
}
