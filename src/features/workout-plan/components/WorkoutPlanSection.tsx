"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import { ChevronLeft, ChevronRight, Dumbbell, Home } from "lucide-react";
import type { WorkoutPlan } from "../types";
import { WorkoutDayView } from "./WorkoutDayView";

interface WorkoutPlanSectionProps {
  gymPlan: WorkoutPlan;
  homePlan: WorkoutPlan;
}

export function WorkoutPlanSection({ gymPlan, homePlan }: WorkoutPlanSectionProps) {
  const [activeType, setActiveType] = useState<"gym" | "home">("gym");
  const [selectedDay, setSelectedDay] = useState(0);

  const currentPlan = activeType === "gym" ? gymPlan : homePlan;
  const currentDayPlan = currentPlan.days[selectedDay];

  const goToPrevDay = () => {
    setSelectedDay((prev) => (prev === 0 ? currentPlan.days.length - 1 : prev - 1));
  };

  const goToNextDay = () => {
    setSelectedDay((prev) => (prev === currentPlan.days.length - 1 ? 0 : prev + 1));
  };

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

        <div className="flex items-center justify-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={goToPrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            {currentPlan.days.map((day, index) => (
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
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <WorkoutDayView workoutDay={currentDayPlan} />
      </div>
    </section>
  );
}
