"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  defaultEmail?: string;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, defaultEmail = "" }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    const { error, user } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (user) {
      setSuccess(true);
      onSuccess?.();
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Cuenta creada</h3>
        <p className="text-gray-400 mb-4">
          Revisa tu correo para confirmar tu cuenta.<br />
          <span className="text-accent-cyan font-medium">{email}</span>
        </p>
        {onSwitchToLogin && (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-accent-cyan hover:underline text-sm font-medium"
          >
            Ir a iniciar sesion
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-2">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-400 mb-2">
            Correo electronico
          </label>
          <input
            id="registerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-400 mb-2">
            Contrasena
          </label>
          <input
            id="registerPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
            placeholder="Minimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
            Confirmar contrasena
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
            placeholder="Repite tu contrasena"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creando cuenta...
            </span>
          ) : (
            "Crear cuenta"
          )}
        </button>
      </div>

      {onSwitchToLogin && (
        <p className="text-center text-gray-400 text-sm mt-6">
          Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-accent-cyan hover:underline font-medium"
          >
            Inicia sesion
          </button>
        </p>
      )}
    </form>
  );
}
