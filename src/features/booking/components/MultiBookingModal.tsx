"use client";

import { useState } from "react";
import { X, Calendar, Clock } from "lucide-react";
import type { TrainingSlot } from "../types";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTH_NAMES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatSlotDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${DAY_NAMES[d.getDay()]} ${day} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const display = h % 12 || 12;
  return `${display}:${String(m).padStart(2, "0")} ${ampm}`;
}

interface MultiBookingModalProps {
  slots: TrainingSlot[];
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function MultiBookingModal({ slots, onConfirm, onClose }: MultiBookingModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reservar");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-gray-800 rounded-t-3xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h4 className="text-white font-bold text-base pr-6 mb-1">Confirmar reservas</h4>
        <p className="text-gray-500 text-sm mb-4">
          {slots.length === 1 ? "1 sesion seleccionada" : `${slots.length} sesiones seleccionadas`}
        </p>

        <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-start gap-3 bg-gray-900/60 rounded-xl p-3"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-cyan/15 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-accent-cyan" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{slot.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{formatSlotDate(slot.slot_date)}</p>
                <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 hover:text-white transition-all disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/30 transition-all disabled:opacity-50 active:scale-95 text-sm"
          >
            {isConfirming
              ? "Reservando..."
              : slots.length === 1
              ? "Confirmar"
              : `Confirmar ${slots.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}
