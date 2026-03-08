"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { bookingService } from "../services/bookingService";
import type { BookingWithSlot } from "../types";

export function useMyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getUserBookings(user.id);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando reservas");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    const result = await bookingService.cancelBooking(bookingId);
    if (result.success) {
      await fetchBookings();
    }
    return result;
  }, [fetchBookings]);

  return { bookings, isLoading, error, cancelBooking, refetch: fetchBookings };
}
