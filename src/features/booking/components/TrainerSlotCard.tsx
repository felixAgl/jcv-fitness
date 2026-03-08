"use client";

import { useState } from "react";
import { Clock, Users, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { SlotWithBookings } from "../types";

interface TrainerSlotCardProps {
  slot: SlotWithBookings;
  onCancel: (slotId: string) => Promise<void>;
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function TrainerSlotCard({ slot, onCancel }: TrainerSlotCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmedBookings = (slot.bookings ?? []).filter((b) => b.status === "confirmed");
  const isFull = slot.booked_count >= slot.max_capacity;

  const handleCancel = async () => {
    if (!confirm("Cancelar este horario? Los clientes que lo reservaron seran afectados.")) return;
    setIsCancelling(true);
    try {
      await onCancel(slot.id);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-card border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold truncate">{slot.title}</h4>

            <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-sm">
              <Users className="w-3.5 h-3.5 shrink-0 text-gray-500" />
              <span className={cn(isFull ? "text-accent-cyan font-semibold" : "text-gray-400")}>
                {slot.booked_count}/{slot.max_capacity} reservados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmedBookings.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
              title="Cancelar horario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {slot.notes && (
          <p className="mt-2 text-xs text-gray-500">{slot.notes}</p>
        )}
      </div>

      {expanded && confirmedBookings.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reservas confirmadas</p>
          {confirmedBookings.map((booking) => (
            <div key={booking.id} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-xs text-gray-400">
                  {(booking.profile?.full_name ?? booking.profile?.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-300">
                {booking.profile?.full_name ?? booking.profile?.email ?? "Cliente"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
