"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CreateSlotInput, RecurringSlotInput } from "../types";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function generateSlotDates(input: RecurringSlotInput): string[] {
  const dates: string[] = [];
  const start = new Date(input.start_date + "T00:00:00");
  const end = new Date(input.end_date + "T00:00:00");

  if (start > end) return [];

  const current = new Date(start);
  const MAX_SLOTS = 200;

  while (current <= end && dates.length < MAX_SLOTS) {
    const dayOfWeek = current.getDay();
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    if (input.repeat === "once") {
      dates.push(dateStr);
      break;
    } else if (input.repeat === "daily") {
      dates.push(dateStr);
    } else if (input.repeat === "weekly" && input.days_of_week.includes(dayOfWeek)) {
      dates.push(dateStr);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

interface RecurringSlotFormProps {
  onSubmit: (inputs: CreateSlotInput[]) => Promise<void>;
  onClose: () => void;
}

export function RecurringSlotForm({ onSubmit, onClose }: RecurringSlotFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<RecurringSlotInput>({
    title: "",
    start_date: today,
    end_date: today,
    start_time: "07:00",
    end_time: "08:00",
    max_capacity: 1,
    notes: "",
    repeat: "once",
    days_of_week: [1, 2, 3, 4, 5],
  });

  const update = <K extends keyof RecurringSlotInput>(key: K, value: RecurringSlotInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  const previewDates = generateSlotDates(form);
  const previewCount = previewDates.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("El titulo es obligatorio");
      return;
    }
    if (form.start_time >= form.end_time) {
      setError("La hora de fin debe ser mayor a la de inicio");
      return;
    }
    if (form.repeat === "weekly" && form.days_of_week.length === 0) {
      setError("Selecciona al menos un dia de la semana");
      return;
    }
    if (previewCount === 0) {
      setError("No hay fechas en el rango seleccionado");
      return;
    }

    const inputs: CreateSlotInput[] = previewDates.map((date) => ({
      title: form.title.trim(),
      slot_date: date,
      start_time: form.start_time,
      end_time: form.end_time,
      max_capacity: form.max_capacity,
      notes: form.notes?.trim() || undefined,
    }));

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(inputs);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear los horarios");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-5">Nuevo horario</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
              Titulo *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="ej: Entrenamiento funcional"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:border-accent-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
              Repeticion
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["once", "daily", "weekly"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    update("repeat", mode);
                    if (mode === "once") update("end_date", form.start_date);
                  }}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    form.repeat === mode
                      ? "bg-accent-cyan text-black"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {mode === "once" ? "Una vez" : mode === "daily" ? "Diario" : "Semanal"}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-3 ${form.repeat === "once" ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                {form.repeat === "once" ? "Fecha *" : "Desde *"}
              </label>
              <input
                type="date"
                value={form.start_date}
                min={today}
                onChange={(e) => {
                  update("start_date", e.target.value);
                  if (form.repeat === "once") update("end_date", e.target.value);
                  if (e.target.value > form.end_date) update("end_date", e.target.value);
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-accent-cyan focus:outline-none"
              />
            </div>
            {form.repeat !== "once" && (
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                  Hasta *
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) => update("end_date", e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-accent-cyan focus:outline-none"
                />
              </div>
            )}
          </div>

          {form.repeat === "weekly" && (
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Dias de la semana *
              </label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.days_of_week.includes(idx)
                        ? "bg-accent-cyan text-black"
                        : "bg-gray-800 text-gray-500 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Hora inicio *
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => update("start_time", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-accent-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Hora fin *
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => update("end_time", e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-accent-cyan focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
              Capacidad maxima
            </label>
            <input
              type="number"
              value={form.max_capacity}
              min={1}
              max={20}
              onChange={(e) => update("max_capacity", Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-accent-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="ej: Traer ropa comoda, agua..."
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {previewCount > 0 && (
            <div className="bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
              <p className="text-accent-cyan text-sm font-semibold">
                {previewCount === 1 ? "1 horario a crear" : `${previewCount} horarios a crear`}
              </p>
              {form.repeat !== "once" && (
                <p className="text-gray-500 text-xs">
                  {form.start_date} → {form.end_date}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 hover:text-white transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || previewCount === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/30 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting
                ? "Creando..."
                : previewCount === 1
                ? "Crear horario"
                : `Crear ${previewCount} horarios`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
