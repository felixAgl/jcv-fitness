"use client";

import { MealCard } from "./MealCard";
import { cn } from "@/shared/lib/cn";
import type { DayPlan } from "../types";

interface DayPlanViewProps {
  dayPlan: DayPlan;
  isPreview?: boolean;
}

const PREVIEW_MEALS = 3; // En preview, mostrar solo 3 comidas claras

export function DayPlanView({ dayPlan, isPreview = false }: DayPlanViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background font-bold text-lg">
          {dayPlan.day}
        </div>
        <h3 className="text-2xl font-bold">{dayPlan.dayName}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {dayPlan.meals.map((meal, index) => (
          <div
            key={meal.id}
            className={cn(
              "transition-all",
              isPreview && index >= PREVIEW_MEALS && "blur-sm opacity-50 pointer-events-none select-none"
            )}
          >
            <MealCard meal={meal} />
          </div>
        ))}
      </div>
    </div>
  );
}
