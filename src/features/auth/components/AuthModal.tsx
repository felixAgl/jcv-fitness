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
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
  defaultEmail,
  onSuccess,
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

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </h2>
          <p className="text-gray-400">
            {mode === "login"
              ? "Accede a tu plan personalizado"
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
