"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requireSubscription = false,
  fallbackUrl = "/",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.replace(fallbackUrl);
      return;
    }

    // Note: We don't redirect for subscription here anymore
    // Instead we show a proper "no subscription" UI
  }, [isAuthenticated, isLoading, router, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Block content if subscription is required but user doesn't have one
  if (requireSubscription && !profile?.has_active_subscription) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Contenido Exclusivo</h2>
          <p className="text-gray-400 mb-6">
            Este contenido requiere una suscripción activa.
            Activa tu plan para acceder a todas las funcionalidades.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="w-full py-3 rounded-xl bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold transition-all"
            >
              Ver Planes
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all"
            >
              Volver al Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
