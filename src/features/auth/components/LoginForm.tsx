"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { signIn, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<"password" | "magic">("password");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    onSuccess?.();
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setIsLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-accent-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Revisa tu correo</h3>
        <p className="text-gray-400 mb-4">
          Enviamos un enlace de acceso a<br />
          <span className="text-accent-cyan font-medium">{email}</span>
        </p>
        <button
          type="button"
          onClick={() => setMagicLinkSent(false)}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Volver a intentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setAuthMethod("password")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            authMethod === "password"
              ? "bg-accent-cyan text-black"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Contrasena
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod("magic")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            authMethod === "magic"
              ? "bg-accent-cyan text-black"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={authMethod === "password" ? handlePasswordLogin : handleMagicLink}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Correo electronico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          {authMethod === "password" && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan transition-colors"
                placeholder="Tu contrasena"
              />
            </div>
          )}

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
                Procesando...
              </span>
            ) : authMethod === "password" ? (
              "Iniciar sesion"
            ) : (
              "Enviar Magic Link"
            )}
          </button>
        </div>
      </form>

      {onSwitchToRegister && (
        <p className="text-center text-gray-400 text-sm mt-6">
          No tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-accent-cyan hover:underline font-medium"
          >
            Registrate
          </button>
        </p>
      )}
    </div>
  );
}
