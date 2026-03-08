"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  useTrainerSlots,
  RecurringSlotForm,
  WeekCalendar,
} from "@/features/booking";
import type { CreateSlotInput } from "@/features/booking";

// ─── Week helpers ─────────────────────────────────────────────────────────────

function getWeekDays(offset: number): Date[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function getWeekRange(offset: number) {
  const days = getWeekDays(offset);
  return { from: toDateStr(days[0]), to: toDateStr(days[6]) };
}

// ─── Page content ─────────────────────────────────────────────────────────────

function AdminAgendaContent() {
  const router = useRouter();
  const { profile, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSlotForm, setShowSlotForm] = useState(false);

  const weekDays = getWeekDays(weekOffset);
  const { from, to } = getWeekRange(weekOffset);
  const { slots, isLoading, error, createSlots, cancelSlot } = useTrainerSlots(from, to);

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

  const handleCreateSlots = async (inputs: CreateSlotInput[]) => {
    await createSlots(inputs);
  };

  const weekLabel =
    weekOffset === 0
      ? "Esta semana"
      : weekOffset === 1
      ? "Proxima semana"
      : weekOffset < 0
      ? "Semana pasada"
      : `Semana del ${from}`;

  const totalBooked = slots.reduce((acc, s) => acc + s.booked_count, 0);
  const totalFree = slots.reduce((acc, s) => acc + (s.max_capacity - s.booked_count), 0);

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
            Nuevo
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
              <p className="text-2xl font-black text-white">{totalFree}</p>
              <p className="text-gray-500 text-xs mt-0.5">Lugares libres</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Calendario</h2>
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
          <div className="h-64 bg-card border border-gray-800 rounded-xl animate-pulse" />
        ) : slots.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-semibold">No hay horarios esta semana</p>
            <p className="text-gray-600 text-sm mt-1 mb-5">
              Crea horarios para que tus clientes puedan reservar
            </p>
            <button
              onClick={() => setShowSlotForm(true)}
              className="px-6 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/30 transition-all"
            >
              Crear primer horario
            </button>
          </div>
        ) : (
          <WeekCalendar
            mode="trainer"
            slots={slots}
            weekDays={weekDays}
            onCancelSlot={cancelSlot}
          />
        )}
      </div>

      {showSlotForm && (
        <RecurringSlotForm
          onSubmit={handleCreateSlots}
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
