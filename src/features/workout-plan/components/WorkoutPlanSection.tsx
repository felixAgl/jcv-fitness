"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { Dumbbell, Home, Lock } from "lucide-react";
import type { WorkoutPlan } from "../types";
import { WorkoutDayView } from "./WorkoutDayView";

interface WorkoutPlanSectionProps {
  gymPlan: WorkoutPlan;
  homePlan: WorkoutPlan;
  isPreview?: boolean;
}

const PREVIEW_DAYS = 2; // Solo mostrar 2 dias en preview

export function WorkoutPlanSection({ gymPlan, homePlan, isPreview = true }: WorkoutPlanSectionProps) {
  const [activeType, setActiveType] = useState<"gym" | "home">("gym");
  const [selectedDay, setSelectedDay] = useState(0);

  const currentPlan = activeType === "gym" ? gymPlan : homePlan;

  // En preview mode, solo mostrar los primeros dias
  const visibleDays = isPreview ? currentPlan.days.slice(0, PREVIEW_DAYS) : currentPlan.days;
  const currentDayPlan = visibleDays[selectedDay];
  const hiddenDaysCount = currentPlan.days.length - PREVIEW_DAYS;

  const handleTypeChange = (type: "gym" | "home") => {
    setActiveType(type);
    setSelectedDay(0);
  };

  return (
    <section id="workout-plan" className="py-20 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Plan de <span className="text-accent">Entrenamiento</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Elige entre nuestro plan de gimnasio de {gymPlan.daysPerWeek} dias o el plan para casa
            de {homePlan.daysPerWeek} dias. Ambos diseñados para maximizar resultados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button
            variant={activeType === "gym" ? "secondary" : "outline"}
            onClick={() => handleTypeChange("gym")}
            className="gap-2"
          >
            <Dumbbell className="h-4 w-4" />
            Gimnasio ({gymPlan.daysPerWeek} dias)
          </Button>
          <Button
            variant={activeType === "home" ? "secondary" : "outline"}
            onClick={() => handleTypeChange("home")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Casa ({homePlan.daysPerWeek} dias)
          </Button>
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
                    ? "bg-accent text-white"
                    : "bg-card hover:bg-card-hover text-foreground/60"
                )}
              >
                {day.dayName.charAt(0)}
              </button>
            ))}
            {/* Dias bloqueados */}
            {isPreview &&
              currentPlan.days.slice(PREVIEW_DAYS).map((day) => (
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
          <WorkoutDayView workoutDay={currentDayPlan} isPreview={isPreview} />

          {/* Overlay con CTA */}
          {isPreview && (
            <div className="mt-8 relative">
              {/* Blur overlay para simular mas contenido */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />

              {/* CTA Card */}
              <div className="relative z-10 text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                  <Lock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  +{hiddenDaysCount} dias de entrenamiento
                </h3>
                <p className="text-foreground/60 mb-6 max-w-md mx-auto">
                  Accede al plan completo con todos los ejercicios, series, repeticiones y videos
                  demostrativos.
                </p>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors"
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
