"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
  defaultEmail?: string;
  onSuccess?: () => void;
  showStepIndicator?: boolean;
  planName?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
  defaultEmail,
  onSuccess,
  showStepIndicator = false,
  planName,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showStepIndicator && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-cyan text-black font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <span className="text-white text-sm font-medium">Cuenta</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-700" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <span className="text-gray-500 text-sm">Pago</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500">Paso 1 de 2</p>
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </h2>
          <p className="text-gray-400">
            {mode === "login"
              ? "Accede a tu plan personalizado"
              : planName
                ? `Continua para obtener ${planName}`
                : "Comienza tu transformacion"}
          </p>
        </div>

        {mode === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode("login")}
            defaultEmail={defaultEmail}
          />
        )}
      </div>
    </div>
  );
}
