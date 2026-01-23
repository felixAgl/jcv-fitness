"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Pago Exitoso
          </h1>

          <p className="text-gray-400 mb-6">
            Tu pago ha sido procesado correctamente. En breve recibiras un correo con los detalles de tu plan.
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">ID de Transaccion</p>
              <p className="text-accent-cyan font-mono">{paymentId}</p>
              {status && (
                <p className="text-sm text-green-500 mt-2">Estado: {status}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/wizard"
            className="block w-full py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
          >
            Comenzar tu Rutina
          </Link>

          <Link
            href="/"
            className="block w-full py-3 px-6 border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Si tienes alguna pregunta, contactanos por WhatsApp: 314 382 64 30
        </p>
      </div>
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
