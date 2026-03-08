"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  useTrainerSlots,
  SlotForm,
  TrainerSlotCard,
} from "@/features/booking";
import type { CreateSlotInput } from "@/features/booking";

function getWeekRange(offset: number) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(monday), to: fmt(sunday) };
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatDateLabel(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  return `${dayName} ${day} ${monthName}`;
}

function AdminAgendaContent() {
  const router = useRouter();
  const { profile, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSlotForm, setShowSlotForm] = useState(false);

  const { from, to } = getWeekRange(weekOffset);
  const { slots, isLoading, error, createSlot, cancelSlot } = useTrainerSlots(from, to);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push("/");
      } else if (profile && !profile.is_trainer) {
        router.push("/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated, profile, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-accent-cyan border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !profile?.is_trainer) return null;

  const handleCreateSlot = async (input: CreateSlotInput) => {
    await createSlot(input);
  };

  const grouped = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  const weekLabel = weekOffset === 0
    ? "Esta semana"
    : weekOffset === 1
    ? "Proxima semana"
    : `Semana del ${from}`;

  const totalBooked = slots.reduce((acc, s) => acc + s.booked_count, 0);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">Mis horarios</h1>
            <p className="text-gray-500 text-sm">Administra tus turnos de entrenamiento</p>
          </div>
          <button
            onClick={() => setShowSlotForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan text-black font-bold text-sm hover:shadow-lg hover:shadow-accent-cyan/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo horario
          </button>
        </div>

        {slots.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{slots.length}</p>
              <p className="text-gray-500 text-xs mt-0.5">Horarios</p>
            </div>
            <div className="bg-card border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-accent-cyan">{totalBooked}</p>
              <p className="text-gray-500 text-xs mt-0.5">Reservas</p>
            </div>
            <div className="bg-card border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">
                {slots.reduce((acc, s) => acc + (s.max_capacity - s.booked_count), 0)}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Lugares libres</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Horarios</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((v) => Math.max(-1, v - 1))}
              disabled={weekOffset === -1}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-sm min-w-[120px] text-center">{weekLabel}</span>
            <button
              onClick={() => setWeekOffset((v) => Math.min(4, v + 1))}
              disabled={weekOffset === 4}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-semibold">No hay horarios esta semana</p>
            <p className="text-gray-600 text-sm mt-1 mb-5">Crea tu primer horario para que tus clientes puedan reservar</p>
            <button
              onClick={() => setShowSlotForm(true)}
              className="px-6 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/30 transition-all"
            >
              Crear primer horario
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {formatDateLabel(date)}
                </h3>
                <div className="space-y-3">
                  {daySlots.map((slot) => (
                    <TrainerSlotCard
                      key={slot.id}
                      slot={slot}
                      onCancel={cancelSlot}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSlotForm && (
        <SlotForm
          onSubmit={handleCreateSlot}
          onClose={() => setShowSlotForm(false)}
        />
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-accent-cyan border-t-transparent rounded-full" />
    </div>
  );
}

export default function AdminAgendaPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminAgendaContent />
    </Suspense>
  );
}
