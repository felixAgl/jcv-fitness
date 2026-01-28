"use client";

import { useAuth } from "@/features/auth";

export function UserProfile() {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-accent-cyan to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-black">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{displayName}</h2>
          <p className="text-gray-400 text-sm truncate">{user.email}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800 flex gap-3">
        <a
          href="/settings"
          className="flex-1 py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium text-center transition-colors"
        >
          Configuracion
        </a>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex-1 py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
