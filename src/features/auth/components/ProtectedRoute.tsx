"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

    if (requireSubscription && profile && !profile.has_active_subscription) {
      hasRedirected.current = true;
      router.replace("/pricing");
    }
  }, [isAuthenticated, isLoading, profile, requireSubscription, router, fallbackUrl]);

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

  if (requireSubscription && profile && !profile.has_active_subscription) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verificando suscripcion...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
