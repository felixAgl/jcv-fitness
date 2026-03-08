"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  useSlots,
  useMyBookings,
  useTimePreferences,
  SlotList,
  MyBookingsList,
  TimePreferencesForm,
  BookingConfirmModal,
} from "@/features/booking";
import type { TrainingSlot } from "@/features/booking";

function getWeekRange(offset: number) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(monday), to: fmt(sunday) };
}

function AgendaContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);

  const { from, to } = getWeekRange(weekOffset);
  const { slots, isLoading: isSlotsLoading, refetch: refetchSlots } = useSlots(from, to);
  const { bookings, isLoading: isBookingsLoading, cancelBooking, refetch: refetchBookings } = useMyBookings();
  const { preferences, isLoading: isPrefsLoading, isSaving, savePreferences } = useTimePreferences();

  const handleBookConfirmed = () => {
    setSelectedSlot(null);
    refetchSlots();
    refetchBookings();
  };

  const weekLabel = weekOffset === 0
    ? "Esta semana"
    : weekOffset === 1
    ? "Proxima semana"
    : `Semana del ${from}`;

  return (
    <div className="min-h-screen bg-black">
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
                onClick={() => setWeekOffset((v) => Math.max(0, v - 1))}
                disabled={weekOffset === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm min-w-[120px] text-center">{weekLabel}</span>
              <button
                onClick={() => setWeekOffset((v) => Math.min(3, v + 1))}
                disabled={weekOffset === 3}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isSlotsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-card border border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <SlotList
              slots={slots}
              preferences={preferences}
              canBook={isAuthenticated}
              onBook={setSelectedSlot}
              onUpgrade={() => router.push("/")}
            />
          )}
        </section>
      </div>

      {selectedSlot && (
        <BookingConfirmModal
          slot={selectedSlot}
          onConfirm={handleBookConfirmed}
          onClose={() => setSelectedSlot(null)}
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
