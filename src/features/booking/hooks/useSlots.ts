"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { bookingService } from "../services/bookingService";
import type { TrainingSlot } from "../types";

export function useSlots(fromDate: string, toDate: string) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!user?.id) {
      setSlots([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getAvailableSlots(fromDate, toDate, user.id);
      setSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando horarios");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fromDate, toDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, isLoading, error, refetch: fetchSlots };
}
