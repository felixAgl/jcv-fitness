"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/features/exercises";
import { track } from "@/features/shared/analytics/track";

const STORAGE_KEY = "jcv-lang";
const DEFAULT_LANG: Lang = "es";
// In-page event so every useLanguage() instance re-renders when any of them
// changes the language (the "storage" event only fires in OTHER tabs).
const CHANGE_EVENT = "jcv-lang-change";

function readStoredLang(): Lang {
  // Static export: guard against SSR/prerender where window is undefined.
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "es" ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/**
 * UI language preference, defaulting to Spanish and persisted to
 * localStorage ("jcv-lang"). Simple localStorage-synced hook — no context
 * provider needed for the current per-modal usage.
 */
export function useLanguage(): { lang: Lang; setLang: (lang: Lang) => void } {
  // Start with the default (matches the prerendered static HTML) and sync the
  // stored preference after mount to avoid hydration mismatches.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const syncFromStorage = () => setLangState(readStoredLang());
    syncFromStorage();
    window.addEventListener(CHANGE_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    track("language_toggle", undefined, next);
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting the preference is best-effort (e.g. private mode).
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { lang, setLang };
}
