"use client";

import { Clock, Users, CheckCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { TrainingSlot } from "../types";

interface SlotCardProps {
  slot: TrainingSlot;
  isPreferenceMatch?: boolean;
  canBook: boolean;
  onBook: (slot: TrainingSlot) => void;
  onUpgrade?: () => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function SlotCard({ slot, isPreferenceMatch, canBook, onBook, onUpgrade }: SlotCardProps) {
  const isFull = slot.booked_count >= slot.max_capacity;
  const isBooked = slot.is_booked_by_user;
  const spotsLeft = slot.max_capacity - slot.booked_count;

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 transition-all",
        isBooked && "border-accent-cyan/50 bg-accent-cyan/5",
        isPreferenceMatch && !isBooked && "border-accent-cyan/30",
        !isBooked && !isPreferenceMatch && "border-gray-800",
        isFull && !isBooked && "opacity-60"
      )}
    >
      {isPreferenceMatch && !isBooked && (
        <span className="inline-block px-2 py-0.5 bg-accent-cyan/20 text-accent-cyan text-xs font-bold rounded mb-2 uppercase tracking-wide">
          Coincide con tu horario
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate">{slot.title}</h4>

          <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-sm">
            <Users className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            <span className={cn(
              spotsLeft === 0 ? "text-red-400" : spotsLeft === 1 ? "text-orange-400" : "text-gray-400"
            )}>
              {isFull ? "Sin lugares" : `${spotsLeft} lugar${spotsLeft !== 1 ? "es" : ""} disponible${spotsLeft !== 1 ? "s" : ""}`}
            </span>
          </div>

          {slot.notes && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">{slot.notes}</p>
          )}
        </div>

        <div className="shrink-0">
          {isBooked ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Reservado
            </div>
          ) : isFull ? (
            <span className="px-3 py-2 rounded-lg bg-gray-800 text-gray-500 text-sm font-semibold">
              Lleno
            </span>
          ) : canBook ? (
            <button
              onClick={() => onBook(slot)}
              className="px-4 py-2 rounded-lg bg-accent-cyan text-black font-bold text-sm hover:shadow-lg hover:shadow-accent-cyan/30 transition-all active:scale-95"
            >
              Reservar
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="px-3 py-2 rounded-lg border border-accent-danger/50 text-accent-danger text-xs font-semibold hover:bg-accent-danger/10 transition-colors"
            >
              Ver planes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
