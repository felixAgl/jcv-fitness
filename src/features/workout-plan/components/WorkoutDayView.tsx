"use client";

import { Card } from "@/shared/components/ui";
import { Flame, Clock } from "lucide-react";
import type { WorkoutDay } from "../types";
import { ExerciseCard } from "./ExerciseCard";

interface WorkoutDayViewProps {
  workoutDay: WorkoutDay;
}

export function WorkoutDayView({ workoutDay }: WorkoutDayViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white font-bold text-xl">
          {workoutDay.day}
        </div>
        <div>
          <h3 className="text-2xl font-bold">{workoutDay.dayName}</h3>
          <p className="text-foreground/60">{workoutDay.muscleGroup}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {workoutDay.exercises.map((exercise, index) => (
          <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
        ))}
      </div>

      {workoutDay.cardio && (
        <Card className="p-4 bg-accent/10 border-accent/30">
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <h4 className="font-semibold text-accent">Cardio</h4>
              <p className="text-sm text-foreground/70">
                {workoutDay.cardio.type} - {workoutDay.cardio.duration}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-foreground/50">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workoutDay.cardio.duration}
                </span>
                <span>Intensidad: {workoutDay.cardio.intensity}</span>
              </div>
              {workoutDay.cardio.notes && (
                <p className="text-xs text-foreground/50 italic mt-1">{workoutDay.cardio.notes}</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
