"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailureContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Pago Rechazado
          </h1>

          <p className="text-gray-400 mb-6">
            Lo sentimos, no pudimos procesar tu pago. Por favor intenta nuevamente o usa otro metodo de pago.
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Referencia</p>
              <p className="text-gray-400 font-mono text-sm">{paymentId}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/#pricing"
            className="block w-full py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
          >
            Intentar de Nuevo
          </Link>

          <Link
            href="/"
            className="block w-full py-3 px-6 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Necesitas ayuda? Contactanos por WhatsApp: 314 382 64 30
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan" />
        </div>
      }
    >
      <FailureContent />
    </Suspense>
  );
}
