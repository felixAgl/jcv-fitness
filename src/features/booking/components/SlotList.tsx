"use client";

import { SlotCard } from "./SlotCard";
import type { TrainingSlot, UserTimePreferences } from "../types";

interface SlotListProps {
  slots: TrainingSlot[];
  preferences: UserTimePreferences;
  canBook: boolean;
  onBook: (slot: TrainingSlot) => void;
  onUpgrade?: () => void;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatDateLabel(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return "Hoy";
  if (isTomorrow) return "Manana";
  return `${dayName} ${day} ${monthName}`;
}

function isPreferenceMatch(slot: TrainingSlot, prefs: UserTimePreferences): boolean {
  if (prefs.preferred_days.length === 0) return false;

  const [year, month, day] = slot.slot_date.split("-").map(Number);
  const slotDay = new Date(year, month - 1, day).getDay();

  if (!prefs.preferred_days.includes(slotDay)) return false;

  const slotStart = slot.start_time.slice(0, 5);
  const slotEnd = slot.end_time.slice(0, 5);

  return slotStart >= prefs.preferred_time_start && slotEnd <= prefs.preferred_time_end;
}

export function SlotList({ slots, preferences, canBook, onBook, onUpgrade }: SlotListProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay horarios disponibles</p>
        <p className="text-gray-600 text-sm mt-1">El entrenador aun no publico horarios para esta semana</p>
      </div>
    );
  }

  const grouped = slots.reduce<Record<string, TrainingSlot[]>>((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, daySlots]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {formatDateLabel(date)}
          </h3>
          <div className="space-y-3">
            {daySlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isPreferenceMatch={isPreferenceMatch(slot, preferences)}
                canBook={canBook}
                onBook={onBook}
                onUpgrade={onUpgrade}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
