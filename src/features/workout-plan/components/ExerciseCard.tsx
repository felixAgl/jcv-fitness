"use client";

import { Card } from "@/shared/components/ui";
import { Dumbbell, Timer, RotateCcw, Play, Youtube } from "lucide-react";
import type { Exercise } from "../types";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-2">{exercise.name}</h4>
          <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span>{exercise.sets} series</span>
            </div>
            <div className="flex items-center gap-1">
              <RotateCcw className="h-4 w-4 text-primary" />
              <span>{exercise.reps} reps</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4 text-primary" />
              <span>{exercise.rest}</span>
            </div>
          </div>
          {exercise.notes && (
            <p className="mt-2 text-xs text-foreground/50 italic">{exercise.notes}</p>
          )}
        </div>
        <div className="shrink-0">
          {exercise.videoUrl ? (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-xs"
            >
              <Youtube className="h-3 w-3" />
              <span>Video</span>
            </a>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-card-hover text-foreground/30 text-xs">
              <Play className="h-3 w-3" />
              <span>Video</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
