"use client";

import { MealCard } from "./MealCard";
import type { DayPlan } from "../types";

interface DayPlanViewProps {
  dayPlan: DayPlan;
}

export function DayPlanView({ dayPlan }: DayPlanViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background font-bold text-lg">
          {dayPlan.day}
        </div>
        <h3 className="text-2xl font-bold">{dayPlan.dayName}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {dayPlan.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  );
}
