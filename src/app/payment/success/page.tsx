"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, AuthModal } from "@/features/auth";
import { useSubscription, useWizardData, subscriptionService } from "@/features/subscription";
import type { Subscription } from "@/features/subscription";
import { buildWhatsAppUrl } from "@/features/landing/utils/whatsapp";

// Poll for the worker-created subscription for up to ~90s. Activation is done by
// the Cloudflare Worker webhook (service role) after a REAL verified payment;
// this page only REFLECTS that state, it never writes it.
const POLL_DEADLINE_MS = 90_000;
const POLL_MIN_INTERVAL_MS = 2_000;
const POLL_MAX_INTERVAL_MS = 10_000;

type ActivationState =
  | "verifying"
  | "needsAuth"
  | "polling"
  | "success"
  | "timeout"
  | "pending";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasActiveSubscription, refresh } = useSubscription();
  const { migrateAnonymousData } = useWizardData();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activationState, setActivationState] = useState<ActivationState>("verifying");

  // Guards against overlapping polls / writes after unmount.
  const pollingRef = useRef(false);
  const cancelledRef = useRef(false);

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const status = searchParams.get("status") || searchParams.get("collection_status");

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  // Read-only check: has the webhook created a subscription for this payment yet?
  const findActivation = useCallback(async (): Promise<Subscription | null> => {
    // Prefer the precise match on the payment reference the worker stores.
    if (paymentId) {
      const byRef = await subscriptionService.findSubscriptionByPaymentReference(paymentId);
      if (byRef && byRef.status === "active") return byRef;
    }
    // Fallback: any active subscription on the current user (covers redirects
    // that drop the payment id). Still a pure SELECT, RLS-scoped to own rows.
    if (user?.id) {
      const active = await subscriptionService.getActiveSubscription(user.id);
      if (active) return active;
    }
    return null;
  }, [paymentId, user?.id]);

  const pollForActivation = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    cancelledRef.current = false;
    setActivationState("polling");

    const deadline = Date.now() + POLL_DEADLINE_MS;
    let interval = POLL_MIN_INTERVAL_MS;

    try {
      // Immediate first check, then backoff until the deadline.
      // NOTE: no branch here writes to the DB — activation is the webhook's job.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (cancelledRef.current) return;

        const found = await findActivation();
        if (cancelledRef.current) return;

        if (found) {
          // Wizard data migration is legitimate user-owned data (wizard_data
          // table), NOT an entitlement column, so it stays.
          await migrateAnonymousData();
          await refresh();
          setActivationState("success");
          return;
        }

        if (Date.now() >= deadline) {
          setActivationState("timeout");
          return;
        }

        await sleep(interval);
        interval = Math.min(interval + 1_000, POLL_MAX_INTERVAL_MS);
      }
    } finally {
      pollingRef.current = false;
    }
  }, [findActivation, migrateAnonymousData, refresh]);

  useEffect(() => {
    if (authLoading) return;

    // Payment not approved -> nothing to activate.
    if (status && status !== "approved") {
      setActivationState("pending");
      return;
    }

    // Already entitled (e.g. webhook was fast, or a re-visit) -> reflect success.
    if (hasActiveSubscription) {
      setActivationState("success");
      return;
    }

    if (isAuthenticated) {
      pollForActivation();
    } else {
      // New users must create an account so the webhook can match them
      // (by user id / email). We still never grant entitlement from the client.
      setActivationState("needsAuth");
      setShowAuthModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, status, hasActiveSubscription]);

  // Cancel any in-flight poll on unmount.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await pollForActivation();
  };

  const handleRetry = () => {
    pollForActivation();
  };

  // Loading / verifying / actively polling for the webhook activation.
  if (authLoading || activationState === "verifying" || activationState === "polling") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {activationState === "polling" ? "Activando tu suscripción..." : "Verificando..."}
          </p>
          {activationState === "polling" && (
            <p className="text-gray-600 text-sm mt-2">
              Estamos confirmando tu pago. Esto puede tomar unos segundos.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Payment not approved
  if (activationState === "pending") {
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
            Tu pago está siendo procesado. Te notificaremos cuando se confirme.
          </p>
          <Link href="/" className="inline-block py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Approved payment but the visitor is not signed in. They must create/enter an
  // account so the webhook can match the payment to them. We NEVER grant
  // entitlement from the client — activation still comes from the webhook.
  if (activationState === "needsAuth") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Pago Exitoso</h1>
          <p className="text-gray-400 mb-6">
            Recibimos tu pago. Crea tu cuenta o inicia sesión para activar tu
            suscripción.
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">ID de Transacción</p>
              <p className="text-accent-cyan font-mono text-sm">{paymentId}</p>
            </div>
          )}

          <div className="space-y-4">
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
          </div>

          <p className="text-xs text-gray-600 mt-8">
            Si tienes alguna pregunta, contáctanos por{" "}
            <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">WhatsApp</a>
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

  // Activation could not be confirmed in time. We do NOT write anything here —
  // the webhook (and the worker's reconciliation sweep) will still activate the
  // subscription. Offer a manual re-check and a support channel.
  if (activationState === "timeout") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-accent-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Confirmando tu pago</h1>
          <p className="text-gray-400 mb-2">
            Recibimos tu pago. La activación puede tardar unos minutos.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Puedes recargar en un momento o volver a intentar. Si no se activa, te
            ayudamos por WhatsApp y quedará listo enseguida.
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">ID de Transacción</p>
              <p className="text-accent-cyan font-mono text-sm">{paymentId}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleRetry}
              className="block w-full py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
            >
              Volver a comprobar
            </button>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 border border-accent-cyan text-accent-cyan font-medium rounded-lg hover:bg-accent-cyan/10 transition-colors"
            >
              Escribir por WhatsApp
            </a>
            <Link
              href="/dashboard"
              className="block w-full py-3 px-6 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Ir a Mi Panel
            </Link>
          </div>
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

  // activationState === "success"
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Suscripción Activada</h1>

          <p className="text-gray-400 mb-6">
            Tu plan ya está activo. Puedes acceder a todo tu contenido personalizado.
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">ID de Transacción</p>
              <p className="text-accent-cyan font-mono text-sm">{paymentId}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
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
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Si tienes alguna pregunta, contáctanos por{" "}
          <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">WhatsApp</a>
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
