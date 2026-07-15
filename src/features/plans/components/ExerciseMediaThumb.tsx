"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { getExerciseMedia } from "@/features/wizard/data/exercise-media";
import { ExerciseDetailModal } from "./ExerciseDetailModal";

interface ExerciseMediaThumbProps {
  exerciseId: string;
  emoji?: string;
  name?: string;
}

/**
 * Thumbnail for an exercise. Shows the static JPG with a Play badge and opens
 * the ExerciseDetailModal (animated GIF + instructions) on tap/click. Falls
 * back to the emoji circle when the exercise has no media or the JPG fails
 * to load.
 */
export function ExerciseMediaThumb({ exerciseId, emoji, name }: ExerciseMediaThumbProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const media = getExerciseMedia(exerciseId);

  if (!media || imageFailed) {
    return (
      <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center text-lg shrink-0">
        {emoji || "🏋️"}
      </div>
    );
  }

  const label = name || exerciseId;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={`Ver demostracion de ${label}`}
        className="relative size-20 sm:size-24 rounded-xl overflow-hidden shrink-0 bg-white ring-1 ring-white/10 hover:ring-2 hover:ring-accent-cyan/60 hover:shadow-lg hover:shadow-accent-cyan/20 transition-all"
      >
        {/* Static export: plain <img>, not next/image */}
        <img
          src={media.image}
          alt={label}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center pointer-events-none">
          <Play className="w-2.5 h-2.5 text-white fill-white" aria-hidden="true" />
        </span>
      </button>

      {modalOpen && (
        <ExerciseDetailModal
          exerciseId={exerciseId}
          name={label}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
