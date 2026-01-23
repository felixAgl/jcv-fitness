"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { ChevronLeft, ChevronRight, Calendar, Apple } from "lucide-react";
import { DayPlanView } from "./DayPlanView";
import { FoodExchangeTable } from "./FoodExchangeTable";
import type { MealPlanConfig } from "../types";

interface MealPlanSectionProps {
  config: MealPlanConfig;
}

export function MealPlanSection({ config }: MealPlanSectionProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showExchanges, setShowExchanges] = useState(false);

  const currentDayPlan = config.days[selectedDay];

  const goToPrevDay = () => {
    setSelectedDay((prev) => (prev === 0 ? config.days.length - 1 : prev - 1));
  };

  const goToNextDay = () => {
    setSelectedDay((prev) => (prev === config.days.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="meal-plan" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Plan de <span className="text-primary">Alimentacion</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            {config.phaseName} - {config.duration}. {config.dailyMeals} comidas diarias
            diseñadas para optimizar tu metabolismo y resultados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button
            variant={!showExchanges ? "primary" : "outline"}
            onClick={() => setShowExchanges(false)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Plan Semanal
          </Button>
          <Button
            variant={showExchanges ? "primary" : "outline"}
            onClick={() => setShowExchanges(true)}
            className="gap-2"
          >
            <Apple className="h-4 w-4" />
            Tabla de Intercambios
          </Button>
        </div>

        {!showExchanges ? (
          <>
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button variant="ghost" size="sm" onClick={goToPrevDay}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex gap-2">
                {config.days.map((day, index) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(index)}
                    className={cn(
                      "w-10 h-10 rounded-full font-bold transition-colors",
                      selectedDay === index
                        ? "bg-primary text-background"
                        : "bg-card hover:bg-card-hover text-foreground/60"
                    )}
                  >
                    {day.dayName.charAt(0)}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={goToNextDay}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <DayPlanView dayPlan={currentDayPlan} />
          </>
        ) : (
          <FoodExchangeTable exchanges={config.exchanges} />
        )}
      </div>
    </section>
  );
}
