"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { getExerciseMedia } from "@/features/wizard/data/exercise-media";

interface ExerciseMediaThumbProps {
  exerciseId: string;
  emoji?: string;
  name?: string;
}

/**
 * Thumbnail for an exercise. Shows the static JPG when media exists and
 * toggles to the animated GIF on tap/click. Falls back to the emoji circle
 * (current behavior) when the exercise has no media.
 */
export function ExerciseMediaThumb({ exerciseId, emoji, name }: ExerciseMediaThumbProps) {
  const [showGif, setShowGif] = useState(false);
  const media = getExerciseMedia(exerciseId);

  if (!media) {
    return (
      <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center text-lg shrink-0">
        {emoji || "🏋️"}
      </div>
    );
  }

  const label = name || exerciseId;

  return (
    <button
      type="button"
      onClick={() => setShowGif((prev) => !prev)}
      aria-label={showGif ? `Detener demostracion de ${label}` : `Ver demostracion de ${label}`}
      className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-700 hover:border-accent-cyan/60 transition-colors"
    >
      {/* Static export: plain <img>, not next/image */}
      <img
        src={showGif ? media.gif : media.image}
        alt={label}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      {!showGif && (
        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center pointer-events-none">
          <Play className="w-2.5 h-2.5 text-white fill-white" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
