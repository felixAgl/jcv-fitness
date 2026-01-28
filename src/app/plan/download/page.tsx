"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedRoute, useAuth } from "@/features/auth";
import { useSubscription } from "@/features/subscription";

export default function DownloadPlanPage() {
  const { user, profile } = useAuth();
  const { subscription, hasActiveSubscription, daysRemaining, isLoading } = useSubscription();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!hasActiveSubscription || !user) return;

    setIsDownloading(true);
    setError(null);

    try {
      // Generate watermarked PDF URL
      const watermark = `${profile?.full_name || user.email} - ${new Date().toLocaleDateString("es-CO")}`;

      // In production, this would call a Supabase Edge Function to generate the PDF
      // For now, we'll show a placeholder message
      alert(`Tu plan se descargara con la marca: "${watermark}"`);

      // TODO: Implement actual PDF generation with Edge Function
      // const response = await fetch('/api/generate-pdf', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     userId: user.id,
      //     subscriptionId: subscription?.id,
      //     watermark,
      //   }),
      // });
      // const blob = await response.blob();
      // const url = URL.createObjectURL(blob);
      // window.open(url, '_blank');

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ProtectedRoute requireSubscription>
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Volver al panel</span>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Descargar mi Plan</h1>
            <p className="text-gray-400">
              Descarga tu plan completo en formato PDF
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-accent-cyan/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Plan JCV Fitness</h3>
                <p className="text-gray-400 text-sm">
                  Plan de alimentacion + Rutina de ejercicios
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Estado:</span>
                <span className="text-green-400 font-medium">Activo</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Dias restantes:</span>
                <span className="text-accent-cyan font-medium">
                  {isLoading ? "..." : `${daysRemaining} dias`}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-medium">
                  {subscription?.plan_type?.replace("PLAN_", "") || "Cargando..."}
                </span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-300 text-sm">
                  El PDF se generara con tu nombre y fecha como marca de agua.
                  Este documento es personal e intransferible.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || !hasActiveSubscription}
              className="w-full py-4 rounded-xl bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            Al descargar, aceptas que este contenido es para uso personal.
            <br />
            La distribucion no autorizada esta prohibida.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
