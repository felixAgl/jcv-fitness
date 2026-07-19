"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/features/shared/utils/reduced-motion";

interface PlanForgeProps {
  /** Lines stamped one by one, already formatted ("NIVEL: INTERMEDIO", ...). */
  lines: string[];
  /** Final reveal ("PLAN DE JUAN"). */
  planName: string;
  /** Called when the sequence ends (or the user taps "saltar"). */
  onDone: () => void;
}

const FIRST_LINE_AT_MS = 500;
const LINE_EVERY_MS = 700;
const NAME_GAP_MS = 700;
const HOLD_NAME_MS = 1900;

/**
 * Full-screen "forging" sequence shown right after the plan is created (#13).
 * Pure theater over an instant generation: the user's own choices stamp in
 * Bebas one by one, a progress bar fills with a shimmer, and the plan name is
 * revealed before handing off to the plan view. Skippable via "saltar";
 * prefers-reduced-motion skips the whole sequence.
 */
export function PlanForge({ lines, planName, onDone }: PlanForgeProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showName, setShowName] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Reduced motion: no theater, straight to the plan.
      onDoneRef.current();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    lines.forEach((_, index) => {
      timers.push(setTimeout(() => setVisibleCount(index + 1), FIRST_LINE_AT_MS + index * LINE_EVERY_MS));
    });
    const nameAt = FIRST_LINE_AT_MS + lines.length * LINE_EVERY_MS + NAME_GAP_MS;
    timers.push(setTimeout(() => setShowName(true), nameAt));
    timers.push(setTimeout(() => onDoneRef.current(), nameAt + HOLD_NAME_MS));

    return () => timers.forEach(clearTimeout);
  }, [lines]);

  const handleSkip = () => {
    if (skipped) return;
    setSkipped(true);
    onDoneRef.current();
  };

  if (prefersReducedMotion()) return null;

  const progress = showName ? 100 : Math.round((visibleCount / (lines.length + 1)) * 100);

  return (
    <div
      className="fixed inset-0 z-[95] bg-black flex flex-col items-center justify-center px-6"
      role="status"
      aria-live="polite"
      data-testid="plan-forge"
    >
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 min-h-[16rem] justify-center">
          {lines.slice(0, visibleCount).map((line, index) => (
            <span
              key={index}
              className="forge-stamp font-display text-3xl sm:text-4xl tracking-widest text-white text-center leading-none"
            >
              {line}
            </span>
          ))}

          {showName && (
            <span className="forge-reveal font-display text-5xl sm:text-6xl tracking-widest text-accent-cyan text-center leading-none mt-4">
              {planName}
            </span>
          )}
        </div>

        {/* Progress shimmer */}
        <div className="w-full h-1 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full btn-generate transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-gray-500 hover:text-white text-sm uppercase tracking-[0.25em] transition-colors py-3 px-6"
        >
          saltar
        </button>
      </div>
    </div>
  );
}
