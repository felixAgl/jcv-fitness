"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { JCVLogo } from "@/shared/components/JCVLogo";
import { EmptyPlan } from "@/shared/components/illustrations";
import { useAuth } from "@/features/auth";
import { usePlan } from "@/features/plans/hooks/usePlan";
import { PlanViewer } from "@/features/plans/components/PlanViewer";
import { PlanExpiredOverlay } from "@/features/plans/components/PlanExpiredOverlay";
import { SAMPLE_PLAN } from "@/features/plans/data/sample-plan";

function PreviewBanner() {
  return (
    <div className="bg-gradient-to-r from-accent-cyan/20 to-blue-500/20 border-b border-accent-cyan/30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" aria-label="Volver al inicio" className="shrink-0 hover:opacity-80 transition-opacity">
            <JCVLogo variant="cyan" size="sm" showText />
          </Link>
          <span className="px-2 py-0.5 bg-accent-cyan/20 text-accent-cyan rounded font-bold text-xs uppercase">
            Ejemplo
          </span>
          <span className="text-gray-300 hidden sm:inline">
            Asi luce un plan generado por JCV Fitness
          </span>
        </div>
        <Link
          href="/wizard"
          className="px-4 py-2 rounded-lg bg-accent-cyan text-black font-bold text-sm hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
        >
          Crear Mi Plan Gratis
        </Link>
      </div>
    </div>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as "resumen" | "rutina" | "alimentacion" | null;

  return (
    <div className="min-h-screen bg-black relative">
      <PreviewBanner />
      <PlanViewer plan={SAMPLE_PLAN} initialTab={initialTab || undefined} isPreview />
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-3">
            Te gusto lo que viste?
          </h3>
          <p className="text-gray-400 mb-6">
            Genera tu plan personalizado en 2 minutos. Es gratis.
          </p>
          <Link
            href="/wizard"
            className="btn-cta inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold"
          >
            COMENZAR MI PLAN
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const initialTab = searchParams.get("tab") as "resumen" | "rutina" | "alimentacion" | "calendario" | null;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { plan, isLoading: isPlanLoading, error, isOffline } = usePlan();

  // Preview mode: skip auth entirely
  if (isPreview) {
    return <PreviewContent />;
  }

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
          <EmptyPlan
            title="Todavia no tienes un plan"
            className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-6"
          />
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
      <PlanViewer plan={plan} initialTab={initialTab || undefined} isOffline={isOffline} />
      {plan.isExpired && <PlanExpiredOverlay />}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}

export default function PlanViewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlanViewContent />
    </Suspense>
  );
}
