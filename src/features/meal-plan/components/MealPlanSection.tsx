"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { Calendar, Lock } from "lucide-react";
import { DayPlanView } from "./DayPlanView";
import type { MealPlanConfig } from "../types";

interface MealPlanSectionProps {
  config: MealPlanConfig;
  isPreview?: boolean;
}

const PREVIEW_DAYS = 2; // Solo mostrar 2 dias en preview

export function MealPlanSection({ config, isPreview = true }: MealPlanSectionProps) {
  const [selectedDay, setSelectedDay] = useState(0);

  // En preview mode, solo mostrar los primeros dias
  const visibleDays = isPreview ? config.days.slice(0, PREVIEW_DAYS) : config.days;
  const currentDayPlan = visibleDays[selectedDay];
  const hiddenDaysCount = config.days.length - PREVIEW_DAYS;

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

        <div className="flex items-center justify-center gap-2 mb-8">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-foreground/60">Vista previa del plan semanal</span>
        </div>

        {/* Day selector - solo dias visibles */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex gap-2">
            {visibleDays.map((day, index) => (
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
            {/* Dias bloqueados */}
            {isPreview &&
              config.days.slice(PREVIEW_DAYS).map((day) => (
                <div
                  key={day.day}
                  className="w-10 h-10 rounded-full bg-card/50 text-foreground/30 font-bold flex items-center justify-center cursor-not-allowed"
                  title="Desbloquea el plan completo"
                >
                  <Lock className="h-4 w-4" />
                </div>
              ))}
          </div>
        </div>

        {/* Content con blur parcial en preview */}
        <div className="relative">
          <DayPlanView dayPlan={currentDayPlan} isPreview={isPreview} />

          {/* Overlay con CTA */}
          {isPreview && (
            <div className="mt-8 relative">
              {/* Blur overlay para simular mas contenido */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />

              {/* CTA Card */}
              <div className="relative z-10 text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  +{hiddenDaysCount} dias de plan nutricional
                </h3>
                <p className="text-foreground/60 mb-6 max-w-md mx-auto">
                  Accede al plan completo con todas las comidas, recetas detalladas y tabla de
                  intercambios de alimentos.
                </p>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Desbloquear Plan Completo
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
