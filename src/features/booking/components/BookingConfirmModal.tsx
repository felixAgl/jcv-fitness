"use client";

import { useState } from "react";
import { Clock, X, Dumbbell } from "lucide-react";
import { bookingService } from "../services/bookingService";
import type { TrainingSlot } from "../types";

interface BookingConfirmModalProps {
  slot: TrainingSlot;
  onConfirm: () => void;
  onClose: () => void;
}

const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatSlotDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]} ${day} de ${MONTH_NAMES[month - 1]}`;
}

export function BookingConfirmModal({ slot, onConfirm, onClose }: BookingConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bookingService.bookSlot(slot.id);
      if (result.success) {
        onConfirm();
      } else {
        setError(result.error ?? "Error al reservar");
      }
    } catch {
      setError("Error al reservar. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-cyan/20 mx-auto mb-4">
          <Dumbbell className="w-7 h-7 text-accent-cyan" />
        </div>

        <h3 className="text-xl font-bold text-white text-center mb-1">
          Confirmar Reserva
        </h3>
        <p className="text-gray-400 text-center text-sm mb-5">
          Estas a punto de reservar este horario
        </p>

        <div className="bg-gray-900 rounded-xl p-4 mb-5 space-y-2">
          <p className="text-white font-semibold">{slot.title}</p>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatSlotDate(slot.slot_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4 opacity-0" />
            <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
          </div>
          {slot.notes && (
            <p className="text-gray-500 text-xs mt-1">{slot.notes}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 hover:text-white transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/30 transition-all disabled:opacity-50 active:scale-95"
          >
            {isLoading ? "Reservando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
