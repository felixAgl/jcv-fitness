"use client";

import { useMemo, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import { track } from "@/features/shared/analytics/track";
import { prefersReducedMotion } from "@/features/shared/utils/reduced-motion";
import { getLastSessionFor, type PRResult } from "../services/workout-log";
import type { LoggedSet } from "../types";

interface ExerciseLogSectionProps {
  exerciseId: string;
  /** Planned sets for the exercise; one input row per set. */
  setsCount: number;
  /** Full workout log (all exercises) — the section filters what it needs. */
  log: LoggedSet[];
  /** Optimistic log + PR detection, provided by useWorkoutLog. */
  onLogSet: (set: LoggedSet) => PRResult;
  gymMode: boolean;
}

/** How long the inline PR celebration stays visible. */
const PR_CELEBRATION_MS = 2200;

/** 8 CSS particle offsets for the PR burst (reuses .celebrate-particle). */
const PR_PARTICLE_OFFSETS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return {
    x: `${Math.round(Math.cos(angle) * 34)}px`,
    y: `${Math.round(Math.sin(angle) * 34)}px`,
  };
});

function formatKg(weightKg: number): string {
  return `${Math.round(weightKg * 10) / 10}kg`;
}

/**
 * Expandable "Registrar" section on each rutina exercise card: one row per
 * planned set with reps + peso inputs and one-tap save (optimistic; persist is
 * debounced upstream in useWorkoutLog). Placeholders show the previous
 * session ("ultima vez: 10 x 40kg"). A new PR triggers an inline Bebas-cyan
 * celebration with a small particle burst (TrackingCalendar pattern) and a
 * pr_detected analytics beacon.
 */
export function ExerciseLogSection({
  exerciseId,
  setsCount,
  log,
  onLogSet,
  gymMode,
}: ExerciseLogSectionProps) {
  const [open, setOpen] = useState(false);
  const [pr, setPr] = useState<PRResult | null>(null);
  const prTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Draft input values keyed by setIndex, kept as strings for free typing.
  const [drafts, setDrafts] = useState<Record<number, { reps: string; weight: string }>>({});
  const [savedFlash, setSavedFlash] = useState<number | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todaySets = useMemo(() => {
    const byIndex = new Map<number, LoggedSet>();
    for (const entry of log) {
      if (entry.exerciseId === exerciseId && entry.date === today) {
        byIndex.set(entry.setIndex, entry);
      }
    }
    return byIndex;
  }, [log, exerciseId, today]);

  const lastSession = useMemo(
    () => getLastSessionFor(log, exerciseId, today),
    [log, exerciseId, today]
  );

  const lastSetFor = (setIndex: number): LoggedSet | undefined => {
    if (!lastSession) return undefined;
    return (
      lastSession.sets.find((entry) => entry.setIndex === setIndex) ??
      lastSession.sets[lastSession.sets.length - 1]
    );
  };

  const draftFor = (setIndex: number) => drafts[setIndex] ?? { reps: "", weight: "" };

  const updateDraft = (setIndex: number, field: "reps" | "weight", value: string) => {
    setDrafts((current) => ({
      ...current,
      [setIndex]: { ...draftFor(setIndex), [field]: value },
    }));
  };

  const handleSave = (setIndex: number) => {
    const draft = draftFor(setIndex);
    const saved = todaySets.get(setIndex);
    const reps = draft.reps !== "" ? Number.parseInt(draft.reps, 10) : saved?.reps;
    const weightKg =
      draft.weight !== "" ? Number.parseFloat(draft.weight.replace(",", ".")) : saved?.weightKg;

    if (
      reps === undefined || weightKg === undefined ||
      !Number.isFinite(reps) || !Number.isFinite(weightKg) ||
      reps <= 0 || weightKg < 0
    ) {
      return;
    }

    const result = onLogSet({ date: today, exerciseId, setIndex, reps, weightKg });

    setSavedFlash(setIndex);
    setTimeout(() => setSavedFlash((current) => (current === setIndex ? null : current)), 1200);

    if (result.isPR) {
      track("pr_detected", weightKg, exerciseId);
      if (prTimer.current) clearTimeout(prTimer.current);
      setPr(result);
      prTimer.current = setTimeout(() => setPr(null), PR_CELEBRATION_MS);
      if (!prefersReducedMotion() && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    }
  };

  // 56px targets in gym mode (min-h-14), regular 44px otherwise.
  const controlHeight = gymMode ? "min-h-14 text-lg" : "min-h-11 text-sm";

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-all ${
          gymMode ? "min-h-14 px-5 text-base" : "min-h-11 px-4 text-sm"
        } ${
          open
            ? "bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/50"
            : "bg-white/5 text-gray-300 ring-1 ring-white/10 hover:text-white hover:ring-accent-cyan/40"
        }`}
      >
        <ClipboardList className={gymMode ? "w-5 h-5" : "w-4 h-4"} aria-hidden="true" />
        Registrar
        {todaySets.size > 0 && (
          <span className="text-xs font-normal opacity-80">
            {todaySets.size}/{setsCount}
          </span>
        )}
      </button>

      {open && (
        <div className="relative mt-3 space-y-2" data-testid="exercise-log-section">
          {/* Inline PR celebration: Bebas cyan + small burst */}
          {pr && (
            <div
              data-testid="pr-celebration"
              className="relative flex items-center justify-center gap-2 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/40 overflow-visible"
              aria-live="polite"
            >
              <span className="celebrate-pop font-display text-3xl tracking-widest text-accent-cyan leading-none">
                PR! {formatKg(pr.weightKg)}
              </span>
              {!prefersReducedMotion() && (
                <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                  {PR_PARTICLE_OFFSETS.map((offset, i) => (
                    <span
                      key={i}
                      className="celebrate-particle"
                      style={{ "--burst-x": offset.x, "--burst-y": offset.y } as React.CSSProperties}
                    />
                  ))}
                </span>
              )}
            </div>
          )}

          {Array.from({ length: setsCount }, (_, setIndex) => {
            const saved = todaySets.get(setIndex);
            const last = lastSetFor(setIndex);
            const draft = draftFor(setIndex);
            return (
              <div
                key={setIndex}
                className={`flex items-center gap-2 rounded-xl p-2 ${
                  saved ? "bg-accent-cyan/5 ring-1 ring-accent-cyan/30" : "bg-white/5 ring-1 ring-white/10"
                }`}
              >
                <span
                  className={`font-display text-accent-cyan shrink-0 text-center ${
                    gymMode ? "text-2xl w-8" : "text-lg w-6"
                  }`}
                >
                  {setIndex + 1}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label={`Reps serie ${setIndex + 1}`}
                  placeholder={saved ? String(saved.reps) : last ? String(last.reps) : "reps"}
                  value={draft.reps}
                  onChange={(e) => updateDraft(setIndex, "reps", e.target.value)}
                  className={`w-0 flex-1 rounded-lg bg-black/40 border border-gray-700 px-3 text-white text-center placeholder:text-gray-600 focus:border-accent-cyan focus:outline-none ${controlHeight}`}
                />
                <span className="text-gray-500 text-xs shrink-0">×</span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Peso serie ${setIndex + 1}`}
                  placeholder={saved ? formatKg(saved.weightKg) : last ? formatKg(last.weightKg) : "kg"}
                  value={draft.weight}
                  onChange={(e) => updateDraft(setIndex, "weight", e.target.value)}
                  className={`w-0 flex-1 rounded-lg bg-black/40 border border-gray-700 px-3 text-white text-center placeholder:text-gray-600 focus:border-accent-cyan focus:outline-none ${controlHeight}`}
                />
                <button
                  type="button"
                  onClick={() => handleSave(setIndex)}
                  aria-label={`Guardar serie ${setIndex + 1}`}
                  className={`shrink-0 rounded-lg font-bold px-4 transition-all ${controlHeight} ${
                    savedFlash === setIndex
                      ? "bg-accent-success text-black"
                      : saved
                        ? "bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30"
                        : "bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/40"
                  }`}
                >
                  {savedFlash === setIndex ? "✓" : "OK"}
                </button>
              </div>
            );
          })}

          {lastSession && (
            <p className="text-xs text-gray-500">
              Ultima vez ({lastSession.date}):{" "}
              {lastSession.sets
                .map((entry) => `${entry.reps} x ${formatKg(entry.weightKg)}`)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
