"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { MealPlanConfig } from "../types";
import { DayPlanView } from "./DayPlanView";
import { FoodExchangeTable } from "./FoodExchangeTable";

interface MealPlanWeekProps {
  config: MealPlanConfig;
}

export function MealPlanWeek({ config }: MealPlanWeekProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showExchanges, setShowExchanges] = useState(false);

  const currentDayPlan = config.days.find((d) => d.day === selectedDay);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-primary mb-2">{config.phaseName}</h2>
        <p className="text-foreground/60">
          Duracion: {config.duration} | {config.dailyMeals} comidas diarias
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {config.days.map((day) => (
          <button
            key={day.day}
            onClick={() => setSelectedDay(day.day)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedDay === day.day
                ? "bg-primary text-background"
                : "bg-card hover:bg-card-hover text-foreground border border-border"
            )}
          >
            {day.dayName}
          </button>
        ))}
      </div>

      {currentDayPlan && <DayPlanView dayPlan={currentDayPlan} />}

      <div className="flex justify-center">
        <button
          onClick={() => setShowExchanges(!showExchanges)}
          className="text-primary hover:text-primary-dark underline transition-colors"
        >
          {showExchanges ? "Ocultar tabla de intercambios" : "Ver tabla de intercambios"}
        </button>
      </div>

      {showExchanges && <FoodExchangeTable exchanges={config.exchanges} />}
    </div>
  );
}
