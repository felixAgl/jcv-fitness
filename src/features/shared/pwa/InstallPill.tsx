"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";
import {
  clearDeferredPrompt,
  getDeferredPrompt,
  subscribeInstallPrompt,
} from "./install-prompt";

// Dismissal persists so the pill never nags a user who said no.
const DISMISS_STORAGE_KEY = "jcv-install-pill-dismissed";

/**
 * Dismissible "Instala JCV Fitness" pill for engaged surfaces (PlanViewer).
 * Renders nothing until the browser offers beforeinstallprompt (i.e. the app
 * is installable and not yet installed), or after the user dismisses it.
 */
export function InstallPill() {
  const deferredPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getDeferredPrompt,
    () => null
  );
  const [dismissed, setDismissed] = useState(true); // true until storage read

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false); // Storage unavailable: show it, just don't persist.
    }
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // Prompt already used or blocked: nothing to do.
    }
    clearDeferredPrompt(); // The event is single-use either way.
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    } catch {
      // Preference simply won't persist.
    }
  };

  return (
    <div className="bg-accent-cyan/10 border border-accent-cyan/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Download className="w-5 h-5 text-accent-cyan flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm">Instala JCV Fitness</div>
          <div className="text-gray-400 text-xs">
            Tu plan disponible sin internet, directo desde tu pantalla de inicio
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-4 py-2 rounded-lg bg-accent-cyan text-black font-semibold text-sm hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
