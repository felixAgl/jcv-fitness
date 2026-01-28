"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/features/auth";
import { SubscriptionCard, QuickActions, UserProfile } from "@/features/dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="block text-center mb-8 hover:opacity-80 transition-opacity">
            <h1 className="text-3xl md:text-4xl font-black">
              <span className="text-accent-cyan">JCV</span>{" "}
              <span className="text-white">FITNESS</span>
            </h1>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Mi Panel</h2>
            <p className="text-gray-400">Gestiona tu suscripcion y accede a tu plan personalizado</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SubscriptionCard />
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Acciones rapidas</h3>
                <QuickActions />
              </div>
            </div>

            <div className="space-y-6">
              <UserProfile />

              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h4 className="font-semibold text-white mb-3">Necesitas ayuda?</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Nuestro equipo esta disponible para ayudarte con cualquier pregunta.
                </p>
                <a
                  href="https://wa.me/573001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium text-center transition-colors text-sm"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
