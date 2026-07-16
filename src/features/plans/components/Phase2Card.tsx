"use client";

import { useMemo, useState } from "react";
import { Lock, TrendingUp } from "lucide-react";
import { useAuth } from "@/features/auth";
import { CheckoutModal } from "@/features/payment/components/CheckoutModal";
import { SUBSCRIPTION_PLANS } from "@/features/subscription";
import { TRANSLATIONS } from "@/features/wizard/types";
import { exercises } from "@/features/wizard/data/exercises";
import { track } from "@/features/shared/analytics/track";
import { generatePhase2Preview, type Phase2Input } from "../services/phase2";

interface Phase2CardProps {
  planData: Phase2Input;
}

/** Renewal checkout reuses the existing PLAN_BASICO tier (amount 49900 maps
 *  to PLAN_BASICO / 40 days in the worker's PLAN_CONFIG — no new prices). */
const RENEWAL_PLAN_ID = "PLAN_BASICO" as const;

/** Teaser: how many progressed training days get a visible row. */
const VISIBLE_TEASER_DAYS = 2;
/** Locked placeholder rows under the blur (NOT real plan content). */
const LOCKED_PLACEHOLDER_ROWS = [
  "Dia de entreno · 5 ejercicios con progresion",
  "Dia de entreno · series y descansos ajustados",
  "Dia de entreno · sobrecarga en basicos",
];

function getExerciseName(exerciseId: string): string {
  return exercises.find((ex) => ex.id === exerciseId)?.name || exerciseId;
}

export function Phase2Card({ planData }: Phase2CardProps) {
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const preview = useMemo(() => generatePhase2Preview(planData), [planData]);

  const renewalPlan = SUBSCRIPTION_PLANS.find((p) => p.id === RENEWAL_PLAN_ID);

  if (!preview || !renewalPlan) return null;

  const trainingDays = preview.days.filter((d) => !d.restDay);
  const teaserDays = trainingDays.slice(0, VISIBLE_TEASER_DAYS);

  const handleUnlock = () => {
    track("checkout_click", undefined, "fase2");
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-accent-cyan/40 bg-gradient-to-br from-accent-cyan/15 via-gray-900/80 to-gray-900 p-6 mb-6 glow-cyan-soft">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-accent-cyan" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent-cyan">
            Fase 2
          </span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl tracking-wide text-white leading-none mb-2">
          TU FASE 2 ESTA LISTA
        </h2>

        <p className="text-gray-400 text-sm mb-5">
          Los proximos {preview.durationDays} dias, generados con tu mismo perfil pero con progresion:{" "}
          {preview.levelBumped
            ? `subes a nivel ${TRANSLATIONS.levels[preview.level]}.`
            : "+1 serie en los ejercicios compuestos."}
        </p>

        {/* Teaser: first progressed days visible */}
        <div className="space-y-2 mb-2">
          {teaserDays.map((day) => (
            <div
              key={day.dayNumber}
              className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700"
            >
              <span className="font-semibold text-white text-sm">{day.name}</span>
              <span className="text-gray-400 text-xs truncate ml-3">
                {day.exercises
                  .slice(0, 2)
                  .map((ex) => getExerciseName(ex.exerciseId))
                  .join(" · ")}
                {day.exercises.length > 2 ? " · ..." : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Locked rows: CSS-blurred PLACEHOLDERS (the real progressed content
            is intentionally not rendered here, so devtools can't reveal it). */}
        <div className="relative mb-6">
          <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden="true">
            {LOCKED_PLACEHOLDER_ROWS.map((row) => (
              <div
                key={row}
                className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700"
              >
                <span className="font-semibold text-gray-300 text-sm">{row}</span>
                <span className="text-gray-500 text-xs">4 x 8-12</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Lock className="w-6 h-6 text-accent-cyan" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-200 uppercase tracking-widest">
              Desbloquea la Fase 2
            </span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-display text-4xl tracking-wide text-accent-cyan leading-none">
              {renewalPlan.priceDisplay}
            </div>
            <div className="text-xs text-gray-400 mt-1">Precio cliente que renueva</div>
          </div>
          <button
            type="button"
            onClick={handleUnlock}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent-cyan text-black font-bold hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
          >
            Desbloquear Fase 2
          </button>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={RENEWAL_PLAN_ID}
        customerEmail={user?.email}
        userId={user?.id}
      />
    </>
  );
}
