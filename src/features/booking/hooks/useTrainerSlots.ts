"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { bookingService } from "../services/bookingService";
import type { SlotWithBookings, CreateSlotInput } from "../types";

export function useTrainerSlots(fromDate: string, toDate: string) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
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
      const data = await bookingService.getTrainerSlots(user.id, fromDate, toDate);
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

  const createSlot = useCallback(async (input: CreateSlotInput) => {
    if (!user?.id) return;
    await bookingService.createSlot(user.id, input);
    await fetchSlots();
  }, [user?.id, fetchSlots]);

  const cancelSlot = useCallback(async (slotId: string) => {
    await bookingService.cancelSlot(slotId);
    await fetchSlots();
  }, [fetchSlots]);

  return { slots, isLoading, error, createSlot, cancelSlot, refetch: fetchSlots };
}
