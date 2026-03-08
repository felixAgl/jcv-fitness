"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { TrainingSlot, UserTimePreferences, SlotWithBookings } from "../types";

// ─── Calendar constants ────────────────────────────────────────────────────────
const HOUR_HEIGHT = 56; // px per hour
const START_HOUR = 6;   // 6am
const END_HOUR = 21;    // 9pm
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function getSlotPosition(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = (sh - START_HOUR) * 60 + sm;
  const endMin = (eh - START_HOUR) * 60 + em;
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 18);
  return { top, height };
}

function formatHourLabel(hour: number): string {
  if (hour === 12) return "12p";
  return hour > 12 ? `${hour - 12}p` : `${hour}a`;
}

function formatTimeShort(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "p" : "a";
  const display = h % 12 || 12;
  return m === 0 ? `${display}${suffix}` : `${display}:${String(m).padStart(2, "0")}${suffix}`;
}

function formatTimeLong(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const display = h % 12 || 12;
  return `${display}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Trainer slot detail popup ─────────────────────────────────────────────────

interface TrainerSlotPopupProps {
  slot: SlotWithBookings;
  onClose: () => void;
  onCancel: () => Promise<void>;
}

function TrainerSlotPopup({ slot, onClose, onCancel }: TrainerSlotPopupProps) {
  const [cancelling, setCancelling] = useState(false);

  const confirmedBookings = (slot.bookings ?? []).filter((b) => b.status === "confirmed");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-gray-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h4 className="text-white font-bold text-base pr-6">{slot.title}</h4>
        <p className="text-gray-400 text-sm mt-0.5">
          {formatTimeLong(slot.start_time)} – {formatTimeLong(slot.end_time)}
        </p>
        <p className="text-gray-500 text-xs mt-1 mb-4">
          {slot.booked_count}/{slot.max_capacity} reservados
        </p>

        {confirmedBookings.length > 0 ? (
          <div className="space-y-2 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Reservas
            </p>
            {confirmedBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-cyan/20 flex items-center justify-center shrink-0">
                  <span className="text-accent-cyan text-xs font-bold">
                    {(b.profile?.full_name ?? b.profile?.email ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-300 text-sm truncate">
                  {b.profile?.full_name ?? b.profile?.email ?? "Usuario"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm mb-4">Sin reservas aun</p>
        )}

        <button
          onClick={async () => {
            setCancelling(true);
            try {
              await onCancel();
              onClose();
            } finally {
              setCancelling(false);
            }
          }}
          disabled={cancelling}
          className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          {cancelling ? "Cancelando..." : "Cancelar horario"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export interface WeekCalendarProps {
  mode: "client" | "trainer";
  slots: TrainingSlot[];
  weekDays: Date[];
  // Client
  preferences?: UserTimePreferences;
  selectedSlots?: Set<string>;
  canBook?: boolean;
  onSlotToggle?: (slot: TrainingSlot) => void;
  onUpgrade?: () => void;
  // Trainer
  onCancelSlot?: (slotId: string) => Promise<void>;
}

export function WeekCalendar({
  mode,
  slots,
  weekDays,
  preferences,
  selectedSlots,
  canBook,
  onSlotToggle,
  onUpgrade,
  onCancelSlot,
}: WeekCalendarProps) {
  const [activeTrainerSlot, setActiveTrainerSlot] = useState<SlotWithBookings | null>(null);

  const today = new Date().toDateString();

  // Group slots by date string
  const slotsByDate = slots.reduce<Record<string, TrainingSlot[]>>((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  // Current time indicator position
  const now = new Date();
  const currentTimeMinutes =
    (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const currentTimeTop =
    currentTimeMinutes >= 0 && currentTimeMinutes <= TOTAL_HOURS * 60
      ? (currentTimeMinutes / 60) * HOUR_HEIGHT
      : null;

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-0">
        <div
          className="flex"
          style={{ minWidth: `${44 + weekDays.length * 56}px` }}
        >
          {/* Time gutter */}
          <div className="w-11 shrink-0">
            <div className="h-14" />
            <div
              className="relative"
              style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-1.5 text-right"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 7 }}
                >
                  <span className="text-gray-600 text-[10px] leading-none whitespace-nowrap">
                    {formatHourLabel(hour)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {weekDays.map((dayDate) => {
              const dateStr = toDateStr(dayDate);
              const daySlots = slotsByDate[dateStr] ?? [];
              const isToday = dayDate.toDateString() === today;

              return (
                <div key={dateStr} className="flex-1 min-w-[52px]">
                  {/* Day header */}
                  <div className="h-14 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                      {DAY_SHORT[dayDate.getDay()]}
                    </span>
                    <div
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full",
                        isToday ? "bg-accent-cyan" : "bg-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-bold leading-none",
                          isToday ? "text-black" : "text-white"
                        )}
                      >
                        {dayDate.getDate()}
                      </span>
                    </div>
                  </div>

                  {/* Time grid */}
                  <div
                    className="relative border-l border-gray-800/60"
                    style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                  >
                    {/* Hour lines */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className={cn(
                          "absolute left-0 right-0 border-t",
                          hour === START_HOUR
                            ? "border-gray-700/60"
                            : "border-gray-800/40"
                        )}
                        style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Half-hour lines */}
                    {HOURS.map((hour) => (
                      <div
                        key={`${hour}-half`}
                        className="absolute left-0 right-0 border-t border-gray-800/20 border-dashed"
                        style={{
                          top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                        }}
                      />
                    ))}

                    {/* Current time indicator */}
                    {isToday && currentTimeTop !== null && (
                      <div
                        className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                        style={{ top: currentTimeTop }}
                      >
                        <div className="w-2 h-2 rounded-full bg-accent-cyan shrink-0 -ml-1" />
                        <div className="flex-1 h-px bg-accent-cyan/80" />
                      </div>
                    )}

                    {/* Slots */}
                    {daySlots.map((slot) => {
                      const { top, height } = getSlotPosition(
                        slot.start_time,
                        slot.end_time
                      );

                      const isFull = slot.booked_count >= slot.max_capacity;
                      const isBooked = slot.is_booked_by_user;
                      const isSelected =
                        mode === "client" && selectedSlots?.has(slot.id);

                      let blockCls = "";
                      let textCls = "";

                      if (mode === "client") {
                        if (isBooked) {
                          blockCls =
                            "bg-accent-cyan/25 border-accent-cyan/60";
                          textCls = "text-accent-cyan";
                        } else if (isSelected) {
                          blockCls =
                            "bg-accent-cyan/40 border-accent-cyan ring-1 ring-accent-cyan/60";
                          textCls = "text-white";
                        } else if (isFull) {
                          blockCls =
                            "bg-gray-800/30 border-gray-700/30 opacity-40 cursor-not-allowed";
                          textCls = "text-gray-600";
                        } else {
                          blockCls =
                            "bg-accent-cyan/10 border-accent-cyan/30 hover:bg-accent-cyan/20 cursor-pointer";
                          textCls = "text-accent-cyan/90";
                        }
                      } else {
                        const bookedRatio =
                          slot.max_capacity > 0
                            ? slot.booked_count / slot.max_capacity
                            : 0;
                        if (isFull) {
                          blockCls =
                            "bg-green-500/25 border-green-500/50 cursor-pointer hover:bg-green-500/35";
                          textCls = "text-green-300";
                        } else if (bookedRatio > 0) {
                          blockCls =
                            "bg-blue-500/20 border-blue-500/40 cursor-pointer hover:bg-blue-500/30";
                          textCls = "text-blue-300";
                        } else {
                          blockCls =
                            "bg-gray-700/30 border-gray-600/40 cursor-pointer hover:bg-gray-700/50";
                          textCls = "text-gray-400";
                        }
                      }

                      return (
                        <button
                          key={slot.id}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded border overflow-hidden text-left transition-all",
                            blockCls
                          )}
                          style={{ top, height }}
                          onClick={() => {
                            if (mode === "client") {
                              if (isBooked) return;
                              if (!canBook) {
                                onUpgrade?.();
                                return;
                              }
                              if (!isFull) onSlotToggle?.(slot);
                            } else {
                              setActiveTrainerSlot(slot as SlotWithBookings);
                            }
                          }}
                        >
                          <div className="px-1 pt-0.5">
                            <p
                              className={cn(
                                "text-[9px] font-bold leading-none",
                                textCls
                              )}
                            >
                              {formatTimeShort(slot.start_time)}
                            </p>
                            {height > 28 && (
                              <p
                                className={cn(
                                  "text-[8px] leading-tight mt-0.5 truncate opacity-90",
                                  textCls
                                )}
                              >
                                {slot.title}
                              </p>
                            )}
                            {mode === "trainer" && height > 40 && (
                              <p className="text-[8px] text-gray-500 mt-0.5">
                                {slot.booked_count}/{slot.max_capacity}
                              </p>
                            )}
                            {mode === "client" && isSelected && height > 28 && (
                              <p className={cn("text-[8px] font-bold mt-0.5", textCls)}>
                                ✓
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trainer slot detail popup */}
      {mode === "trainer" && activeTrainerSlot && onCancelSlot && (
        <TrainerSlotPopup
          slot={activeTrainerSlot}
          onClose={() => setActiveTrainerSlot(null)}
          onCancel={() => onCancelSlot(activeTrainerSlot.id)}
        />
      )}
    </>
  );
}
