"use client";

import { useEffect } from "react";
import { initInstallPromptCapture } from "./install-prompt";

/**
 * Mounted once in the root layout (same pattern as AnalyticsBeacon).
 * Registers /sw.js after load and captures the beforeinstallprompt event.
 *
 * Skipped on localhost unless the URL contains ?debug_sw, so `npm run dev`
 * never serves stale cached pages. Static export safe: everything runs in a
 * client effect.
 */
export function RegisterSW() {
  useEffect(() => {
    initInstallPromptCapture();

    if (!("serviceWorker" in navigator)) return;

    const isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    if (isLocal && !window.location.search.includes("debug_sw")) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        // Non-fatal: the app works without offline support.
        console.warn("SW registration failed:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
