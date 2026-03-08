"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CreateSlotInput } from "../types";

interface SlotFormProps {
  onSubmit: (input: CreateSlotInput) => Promise<void>;
  onClose: () => void;
  defaultDate?: string;
}

export function SlotForm({ onSubmit, onClose, defaultDate }: SlotFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateSlotInput>({
    title: "",
    slot_date: defaultDate ?? today,
    start_time: "07:00",
    end_time: "08:00",
    max_capacity: 1,
    notes: "",
  });

  const update = <K extends keyof CreateSlotInput>(key: K, value: CreateSlotInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

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

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ ...form, notes: form.notes?.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el horario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
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
              Fecha *
            </label>
            <input
              type="date"
              value={form.slot_date}
              min={today}
              onChange={(e) => update("slot_date", e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-accent-cyan focus:outline-none"
            />
          </div>

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
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/30 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? "Creando..." : "Crear horario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
