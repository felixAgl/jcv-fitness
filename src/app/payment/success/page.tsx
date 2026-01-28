"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, AuthModal } from "@/features/auth";
import { useSubscription, useWizardData } from "@/features/subscription";
import type { PlanType, PaymentProvider } from "@/features/subscription";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { createSubscription, hasActiveSubscription } = useSubscription();
  const { migrateAnonymousData } = useWizardData();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const status = searchParams.get("status") || searchParams.get("collection_status");
  const externalReference = searchParams.get("external_reference");

  // Extract plan info from external reference (format: JCV-timestamp-PLAN_TYPE)
  const planType = (externalReference?.split("-")[2] as PlanType) || "PLAN_PRO";
  const amountPaid = getPlanAmount(planType);

  const handleCreateSubscription = useCallback(async () => {
    if (isProcessing || subscriptionCreated) return;

    setIsProcessing(true);
    setError(null);

    try {
      await createSubscription({
        planType,
        paymentProvider: "mercadopago" as PaymentProvider,
        paymentReference: paymentId || "",
        amountPaid,
      });

      // Migrate anonymous wizard data if exists
      await migrateAnonymousData();

      setSubscriptionCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al activar suscripcion");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, subscriptionCreated, createSubscription, planType, paymentId, amountPaid, migrateAnonymousData]);

  useEffect(() => {
    if (authLoading) return;

    // If user is authenticated and payment successful, create subscription
    if (isAuthenticated && paymentId && status === "approved" && !subscriptionCreated && !hasActiveSubscription) {
      handleCreateSubscription();
    } else if (!isAuthenticated && paymentId && status === "approved") {
      // Show auth modal for new users
      setShowAuthModal(true);
    }
  }, [isAuthenticated, authLoading, paymentId, status, subscriptionCreated, hasActiveSubscription, handleCreateSubscription]);

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await handleCreateSubscription();
  };

  if (authLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {isProcessing ? "Activando tu suscripcion..." : "Verificando..."}
          </p>
        </div>
      </div>
    );
  }

  // Payment not approved
  if (status && status !== "approved") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Pago Pendiente</h1>
          <p className="text-gray-400 mb-6">
            Tu pago esta siendo procesado. Te notificaremos cuando se confirme.
          </p>
          <Link href="/" className="inline-block py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            {subscriptionCreated || hasActiveSubscription ? "Suscripcion Activada" : "Pago Exitoso"}
          </h1>

          <p className="text-gray-400 mb-6">
            {subscriptionCreated || hasActiveSubscription
              ? "Tu plan ya esta activo. Puedes acceder a todo tu contenido personalizado."
              : "Tu pago ha sido procesado correctamente. Crea tu cuenta para activar tu suscripcion."
            }
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">ID de Transaccion</p>
              <p className="text-accent-cyan font-mono text-sm">{paymentId}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {(subscriptionCreated || hasActiveSubscription) ? (
            <>
              <Link
                href="/dashboard"
                className="block w-full py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
              >
                Ir a Mi Panel
              </Link>
              <Link
                href="/plan/alimentacion"
                className="block w-full py-3 px-6 border border-accent-cyan text-accent-cyan font-medium rounded-lg hover:bg-accent-cyan/10 transition-colors"
              >
                Ver mi Plan
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="block w-full py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
              >
                Crear mi cuenta
              </button>
              <Link
                href="/"
                className="block w-full py-3 px-6 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Volver al Inicio
              </Link>
            </>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Si tienes alguna pregunta, contactanos por WhatsApp: 314 382 64 30
        </p>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="register"
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function getPlanAmount(planType: PlanType): number {
  const amounts: Record<PlanType, number> = {
    PLAN_BASICO: 50000,
    PLAN_PRO: 80000,
    PLAN_PREMIUM: 100000,
  };
  return amounts[planType] || 80000;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
