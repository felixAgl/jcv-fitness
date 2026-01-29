"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/features/auth";
import { useSubscription } from "@/features/subscription";
import { MealPlanSection } from "@/features/meal-plan/components/MealPlanSection";
import { mealPlanPhase1 } from "@/features/meal-plan/data/meal-plan-phase1";

export default function MealPlanPage() {
  const { hasActiveSubscription, daysRemaining, isLoading } = useSubscription();

  return (
    <ProtectedRoute requireSubscription>
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Mi Panel</span>
            </Link>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-black">
                <span className="text-accent-cyan">JCV</span>{" "}
                <span className="text-white">FITNESS</span>
              </h1>
            </Link>
            <div className="text-right">
              {!isLoading && hasActiveSubscription && (
                <span className="text-xs text-gray-400">
                  {daysRemaining} dias restantes
                </span>
              )}
            </div>
          </div>
        </header>

        <main>
          <MealPlanSection config={mealPlanPhase1} />
        </main>

        <footer className="py-8 px-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-500 text-sm">
              Este plan es personalizado y exclusivo para tu uso.
              <br />
              No lo compartas con otras personas.
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
