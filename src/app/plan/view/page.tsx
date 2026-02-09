"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { usePlan } from "@/features/plans/hooks/usePlan";
import { PlanViewer } from "@/features/plans/components/PlanViewer";
import { PlanExpiredOverlay } from "@/features/plans/components/PlanExpiredOverlay";

export default function PlanViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as "resumen" | "rutina" | "alimentacion" | "calendario" | null;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { plan, isLoading: isPlanLoading, error } = usePlan();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Loading state
  if (isAuthLoading || isPlanLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full mb-4" />
          <p className="text-gray-400">Cargando tu plan...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // No plan found
  if (!plan) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            No tienes un plan activo
          </h1>
          <p className="text-gray-400 mb-8">
            Genera tu primer plan de entrenamiento personalizado para comenzar tu transformacion.
          </p>
          <div className="grid gap-4">
            <Link
              href="/wizard"
              className="px-8 py-4 rounded-xl font-bold bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
            >
              Crear Mi Plan
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all"
            >
              Ir al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <PlanViewer plan={plan} initialTab={initialTab || undefined} />
      {plan.isExpired && <PlanExpiredOverlay />}
    </div>
  );
}
