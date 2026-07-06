"use client";

import { useState } from "react";
import { Clock, Calendar, X } from "lucide-react";
import type { BookingWithSlot } from "../types";

interface MyBookingsListProps {
  bookings: BookingWithSlot[];
  onCancel: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]} ${day} ${MONTH_NAMES[month - 1]}`;
}

export function MyBookingsList({ bookings, onCancel }: MyBookingsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="bg-card border border-gray-800 rounded-xl p-6 text-center">
        <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No tenes reservas proximas</p>
        <p className="text-gray-600 text-xs mt-1">Reserva un horario abajo para empezar</p>
      </div>
    );
  }

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    setError(null);
    try {
      const result = await onCancel(bookingId);
      if (!result.success) {
        setError(result.error ?? "Error al cancelar");
      }
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-card border border-accent-cyan/30 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{booking.slot.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(booking.slot.slot_date)}
              </span>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(booking.booked_start_time ?? booking.slot.start_time)} -{" "}
                {formatTime(booking.booked_end_time ?? booking.slot.end_time)}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleCancel(booking.id)}
            disabled={cancellingId === booking.id}
            className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
            title="Cancelar reserva"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
