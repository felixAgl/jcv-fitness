"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, AuthModal } from "@/features/auth";
import { SUBSCRIPTION_PLANS, type PlanType } from "@/features/subscription";
import { CheckoutModal } from "@/features/payment/components/CheckoutModal";

export default function PricingPage() {
  const { isAuthenticated, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleSelectPlan = (planId: PlanType) => {
    setSelectedPlan(planId);
    if (isAuthenticated) {
      setShowCheckout(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="block text-center mb-12 hover:opacity-80 transition-opacity">
          <h1 className="text-3xl md:text-4xl font-black">
            <span className="text-accent-cyan">JCV</span>{" "}
            <span className="text-white">FITNESS</span>
          </h1>
        </Link>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Elige tu <span className="text-accent-cyan">Plan</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Invierte en tu salud. Elige el plan que mejor se adapte a tus objetivos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gray-900 rounded-2xl border p-6 transition-all ${
                plan.popular
                  ? "border-accent-cyan shadow-lg shadow-accent-cyan/20 scale-105"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-accent-cyan text-black text-sm font-bold rounded-full">
                    Mas Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-black text-accent-cyan">{plan.priceDisplay}</span>
                  <span className="text-gray-400 text-sm ml-1">COP/mes</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-gray-300 text-sm">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  plan.popular
                    ? "bg-accent-cyan hover:bg-accent-cyan/90 text-black"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                Seleccionar Plan
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Pago seguro con Mercado Pago o Wompi.
            <br />
            Puedes pagar con tarjeta, PSE, Nequi o efectivo.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>

      {selectedPlan && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          selectedPlan={selectedPlan}
          customerEmail={user?.email}
          onPaymentSuccess={(id) => {
            console.log("Payment successful:", id);
            setShowCheckout(false);
          }}
        />
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="register"
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
