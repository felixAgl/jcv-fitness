"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { bookingService } from "../services/bookingService";
import type { UserTimePreferences } from "../types";

const DEFAULT_PREFS: UserTimePreferences = {
  preferred_days: [],
  preferred_time_start: "07:00",
  preferred_time_end: "20:00",
};

export function useTimePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserTimePreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await bookingService.getUserPreferences(user.id);
      setPreferences(data ?? DEFAULT_PREFS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando preferencias");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = useCallback(async (prefs: UserTimePreferences) => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);
    try {
      await bookingService.saveUserPreferences(user.id, prefs);
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando preferencias");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  return { preferences, isLoading, isSaving, error, savePreferences };
}
