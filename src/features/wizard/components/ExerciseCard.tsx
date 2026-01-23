"use client";

import { cn } from "@/shared/utils/cn";
import type { Exercise } from "../types";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: () => void;
}

export function ExerciseCard({ exercise, isSelected, onToggle }: ExerciseCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "p-4 rounded-xl border-2 transition-all duration-300 text-left",
        "hover:scale-[1.01] active:scale-[0.99]",
        isSelected
          ? "border-accent-cyan bg-accent-cyan/20 ring-2 ring-accent-cyan"
          : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0" role="img" aria-hidden="true">
          {exercise.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-bold transition-colors",
            isSelected ? "text-white" : "text-gray-200"
          )}>
            {exercise.name}
          </h4>
          {exercise.altName && (
            <p className="text-xs text-gray-500 italic">
              {exercise.altName}
            </p>
          )}
          <p className={cn(
            "text-sm mt-1",
            isSelected ? "text-gray-300" : "text-gray-400"
          )}>
            {exercise.muscle}
          </p>
        </div>
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          isSelected
            ? "border-accent-cyan bg-accent-cyan"
            : "border-gray-600"
        )}>
          {isSelected && (
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
