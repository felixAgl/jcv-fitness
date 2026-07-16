"use client";

/**
 * Module-level store for the `beforeinstallprompt` event.
 *
 * The browser fires it once, early (often before /plan/view mounts), so the
 * listener is attached at app boot by RegisterSW and the event is parked here
 * until an engaged surface (the InstallPill in PlanViewer) wants it.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Attach global listeners. Idempotent; called once from RegisterSW. */
let initialized = false;
export function initInstallPromptCapture() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // Keep the mini-infobar away; we show our own pill.
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
  notify();
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
