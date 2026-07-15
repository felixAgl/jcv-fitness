"use client";

import Link from "next/link";

export function PlanExpiredOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-8 shadow-2xl text-center">
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
            className="block w-full py-4 rounded-xl font-bold bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
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
    </div>
  );
}
