"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ErrorType = "pkce" | "expired" | "generic";

interface AuthError {
  type: ErrorType;
  message: string;
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      if (!supabase) {
        setError({ type: "generic", message: "Supabase not initialized" });
        return;
      }

      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setError({ type: "generic", message: errorDescription || "Error de autenticacion" });
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Check for PKCE error
          if (error.message.includes("PKCE") || error.message.includes("code verifier")) {
            setError({
              type: "pkce",
              message: "El enlace debe abrirse en el mismo navegador donde solicitaste el acceso.",
            });
            return;
          }
          // Check for expired link
          if (error.message.includes("expired") || error.message.includes("invalid")) {
            setError({
              type: "expired",
              message: "El enlace ha expirado o ya fue utilizado.",
            });
            return;
          }
          setError({ type: "generic", message: error.message });
          return;
        }
      }

      // Check for stored redirect URL
      const redirectTo = localStorage.getItem("auth_redirect") || "/dashboard";
      localStorage.removeItem("auth_redirect");
      router.replace(redirectTo);
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    const isPkceError = error.type === "pkce";
    const isExpiredError = error.type === "expired";

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-md w-full text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPkceError ? "bg-orange-500/20" : "bg-red-500/20"
            }`}
          >
            {isPkceError ? (
              <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isPkceError ? "Navegador diferente detectado" : isExpiredError ? "Enlace expirado" : "Error de autenticacion"}
          </h2>
          <p className="text-gray-400 mb-6">{error.message}</p>

          {isPkceError && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-2">Para iniciar sesion correctamente:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Abre el enlace en el mismo navegador</li>
                <li>O solicita un nuevo enlace desde este dispositivo</li>
              </ol>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-accent-cyan text-black font-bold rounded-xl hover:bg-accent-cyan/90 transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Verificando autenticacion...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
