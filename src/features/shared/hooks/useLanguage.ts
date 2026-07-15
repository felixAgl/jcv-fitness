"use client";

import { useCallback, useState } from "react";
import type { Lang } from "@/features/exercises";

const STORAGE_KEY = "jcv-lang";
const DEFAULT_LANG: Lang = "es";

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
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting the preference is best-effort (e.g. private mode).
    }
  }, []);

  return { lang, setLang };
}
