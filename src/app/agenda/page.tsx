"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  useSlots,
  useMyBookings,
  useTimePreferences,
  MyBookingsList,
  TimePreferencesForm,
  MultiBookingModal,
  WeekCalendar,
  bookingService,
} from "@/features/booking";
import type { TrainingSlot } from "@/features/booking";

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

// ─── Main content ─────────────────────────────────────────────────────────────

function AgendaContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlotsMap, setSelectedSlotsMap] = useState<Map<string, TrainingSlot>>(new Map());
  const selectedSlots = useMemo(() => new Set(selectedSlotsMap.keys()), [selectedSlotsMap]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const weekDays = getWeekDays(weekOffset);
  const { from, to } = getWeekRange(weekOffset);

  const { slots, isLoading: isSlotsLoading, refetch: refetchSlots } = useSlots(from, to);
  const {
    bookings,
    isLoading: isBookingsLoading,
    cancelBooking,
    refetch: refetchBookings,
  } = useMyBookings();
  const {
    preferences,
    isLoading: isPrefsLoading,
    isSaving,
    savePreferences,
  } = useTimePreferences();

  const weekLabel =
    weekOffset === 0
      ? "Esta semana"
      : weekOffset === 1
      ? "Proxima semana"
      : `Semana del ${from}`;

  const handleSlotToggle = useCallback((slot: TrainingSlot) => {
    setSelectedSlotsMap((prev) => {
      const next = new Map(prev);
      if (next.has(slot.id)) {
        next.delete(slot.id);
      } else {
        next.set(slot.id, slot);
      }
      return next;
    });
  }, []);

  const selectedSlotObjects = Array.from(selectedSlotsMap.values());

  const handleMultiBook = async () => {
    if (!user?.id || selectedSlotsMap.size === 0) return;
    const ids = Array.from(selectedSlotsMap.keys());
    const { errors } = await bookingService.bookSlots(ids);
    if (errors.length > 0 && errors.length === ids.length) {
      throw new Error(errors[0]);
    }
    setSelectedSlotsMap(new Map());
    refetchSlots();
    refetchBookings();
  };

  const handleBookConfirmed = () => {
    setSelectedSlotsMap(new Map());
    setShowConfirmModal(false);
    refetchSlots();
    refetchBookings();
  };

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Agendar sesion</h1>
            <p className="text-gray-500 text-sm">Reserva tu horario de entrenamiento</p>
          </div>
        </div>

        {!isAuthLoading && !isAuthenticated && (
          <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-cyan/5 border border-accent-cyan/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold text-sm">Inicia sesion para reservar</p>
              <p className="text-gray-400 text-xs mt-0.5">Podes ver todos los horarios disponibles</p>
            </div>
            <Link
              href="/"
              className="shrink-0 px-4 py-2 rounded-lg bg-accent-cyan text-black font-bold text-sm hover:shadow-lg transition-all"
            >
              Iniciar sesion
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <>
            <section className="mb-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-cyan" />
                Mis reservas proximas
              </h2>
              {isBookingsLoading ? (
                <div className="h-16 bg-card border border-gray-800 rounded-xl animate-pulse" />
              ) : (
                <MyBookingsList bookings={bookings} onCancel={cancelBooking} />
              )}
            </section>

            <section className="mb-6">
              {isPrefsLoading ? (
                <div className="h-48 bg-card border border-gray-800 rounded-xl animate-pulse" />
              ) : (
                <TimePreferencesForm
                  preferences={preferences}
                  isSaving={isSaving}
                  onSave={savePreferences}
                />
              )}
            </section>
          </>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Horarios disponibles</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedSlotsMap(new Map());
                  setWeekOffset((v) => Math.max(0, v - 1));
                }}
                disabled={weekOffset === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm min-w-[120px] text-center">{weekLabel}</span>
              <button
                onClick={() => {
                  setSelectedSlotsMap(new Map());
                  setWeekOffset((v) => Math.min(3, v + 1));
                }}
                disabled={weekOffset === 3}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isSlotsLoading ? (
            <div className="h-64 bg-card border border-gray-800 rounded-xl animate-pulse" />
          ) : (
            <WeekCalendar
              mode="client"
              slots={slots}
              weekDays={weekDays}
              preferences={preferences ?? undefined}
              selectedSlots={selectedSlots}
              canBook={isAuthenticated}
              onSlotToggle={handleSlotToggle}
              onUpgrade={() => {}}
            />
          )}
        </section>
      </div>

      {/* Sticky footer: book selected slots */}
      {selectedSlotsMap.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-t border-gray-800 z-40">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {selectedSlotsMap.size === 1
                  ? "1 sesion seleccionada"
                  : `${selectedSlotsMap.size} sesiones seleccionadas`}
              </p>
              <p className="text-gray-500 text-xs">Toca Reservar para confirmar</p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-3 rounded-xl bg-accent-cyan text-black font-bold text-sm hover:shadow-lg hover:shadow-accent-cyan/30 transition-all active:scale-95"
            >
              Reservar {selectedSlotsMap.size > 1 ? `(${selectedSlotsMap.size})` : ""}
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && selectedSlotObjects.length > 0 && (
        <MultiBookingModal
          slots={selectedSlotObjects}
          onConfirm={handleMultiBook}
          onClose={() => setShowConfirmModal(false)}
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

export default function AgendaPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AgendaContent />
    </Suspense>
  );
}
