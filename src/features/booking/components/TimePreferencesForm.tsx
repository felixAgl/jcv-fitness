"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { UserTimePreferences } from "../types";

interface TimePreferencesFormProps {
  preferences: UserTimePreferences;
  isSaving: boolean;
  onSave: (prefs: UserTimePreferences) => Promise<void>;
}

const DAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mie", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sab", value: 6 },
  { label: "Dom", value: 0 },
];

export function TimePreferencesForm({ preferences, isSaving, onSave }: TimePreferencesFormProps) {
  const [days, setDays] = useState<number[]>(preferences.preferred_days);
  const [startTime, setStartTime] = useState(preferences.preferred_time_start);
  const [endTime, setEndTime] = useState(preferences.preferred_time_end);
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    await onSave({
      preferred_days: days,
      preferred_time_start: startTime,
      preferred_time_end: endTime,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const hasChanged =
    JSON.stringify(days.sort()) !== JSON.stringify([...preferences.preferred_days].sort()) ||
    startTime !== preferences.preferred_time_start ||
    endTime !== preferences.preferred_time_end;

  return (
    <div className="bg-card border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-1">Mis horarios preferidos</h3>
      <p className="text-gray-500 text-sm mb-4">
        Te mostraremos primero los turnos que coincidan con tus disponibilidades
      </p>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Dias disponibles</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => toggleDay(value)}
              className={cn(
                "w-12 h-10 rounded-lg text-sm font-semibold transition-all",
                days.includes(value)
                  ? "bg-accent-cyan text-black"
                  : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Desde
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); setSaved(false); }}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-accent-cyan focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Hasta
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); setSaved(false); }}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-accent-cyan focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || (!hasChanged && !saved)}
        className={cn(
          "w-full py-2.5 rounded-lg font-semibold text-sm transition-all",
          saved
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : hasChanged
            ? "bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/30"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        )}
      >
        {isSaving ? "Guardando..." : saved ? "Guardado" : "Guardar preferencias"}
      </button>
    </div>
  );
}
