"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PendingContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Pago Pendiente
          </h1>

          <p className="text-gray-400 mb-6">
            Tu pago esta siendo procesado. Te notificaremos por correo electronico cuando se confirme.
          </p>

          {paymentId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">ID de Transaccion</p>
              <p className="text-yellow-500 font-mono">{paymentId}</p>
              <p className="text-sm text-yellow-500/70 mt-2">
                Estado: Pendiente de confirmacion
              </p>
            </div>
          )}

          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-white font-semibold mb-2">Que sigue?</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">1.</span>
                Si pagaste en efectivo, completa el pago en el punto autorizado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">2.</span>
                Si usaste PSE, espera la confirmacion del banco
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">3.</span>
                Recibiras un correo cuando el pago sea confirmado
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full py-3 px-6 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Preguntas? WhatsApp: 314 382 64 30
        </p>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan" />
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
