"use client";

import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Play } from "lucide-react";
import { getExerciseMedia } from "@/features/wizard/data/exercise-media";
import { prefersReducedMotion } from "@/features/shared/utils/reduced-motion";
import { ExerciseDetailModal } from "./ExerciseDetailModal";

interface ExerciseMediaThumbProps {
  exerciseId: string;
  emoji?: string;
  name?: string;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

/** CSS custom-ident safe view-transition-name, unique per exercise. */
function viewTransitionNameFor(exerciseId: string): string {
  return `exercise-media-${exerciseId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/**
 * Thumbnail for an exercise. Shows the static JPG with a Play badge and opens
 * the ExerciseDetailModal (animated GIF + instructions) on tap/click. Falls
 * back to the emoji circle when the exercise has no media or the JPG fails
 * to load.
 *
 * Open/close is wrapped in document.startViewTransition() when the browser
 * supports it, morphing the thumb image into the modal media. The
 * view-transition-name is applied imperatively only to the active pair (this
 * thumb + its modal) for the duration of the transition, so duplicate names
 * across the exercise list are impossible. jsdom and older browsers take the
 * plain setState path.
 */
export function ExerciseMediaThumb({ exerciseId, emoji, name }: ExerciseMediaThumbProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const thumbRef = useRef<HTMLImageElement>(null);
  const media = getExerciseMedia(exerciseId);
  const vtName = viewTransitionNameFor(exerciseId);

  const toggleModal = useCallback(
    (open: boolean) => {
      const doc = document as DocumentWithViewTransition;
      if (typeof doc.startViewTransition !== "function" || prefersReducedMotion()) {
        setModalOpen(open);
        return;
      }

      const thumb = thumbRef.current;
      // Opening: the OLD snapshot needs the name on the thumb (modal takes it
      // in the new state). Closing: the old state already names the modal
      // media; the thumb gets the name in the NEW snapshot inside the update.
      if (open && thumb) {
        thumb.style.viewTransitionName = vtName;
      }
      const transition = doc.startViewTransition(() => {
        flushSync(() => setModalOpen(open));
        if (thumb) {
          thumb.style.viewTransitionName = open ? "" : vtName;
        }
      });
      transition.finished.finally(() => {
        // Drop the name once the morph ends so no two thumbs ever share it.
        if (thumbRef.current) thumbRef.current.style.viewTransitionName = "";
      });
    },
    [vtName]
  );

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
        onClick={() => toggleModal(true)}
        aria-label={`Ver demostracion de ${label}`}
        className="relative size-20 sm:size-24 rounded-xl overflow-hidden shrink-0 bg-white ring-1 ring-white/10 hover:ring-2 hover:ring-accent-cyan/60 hover:shadow-lg hover:shadow-accent-cyan/20 transition-all"
      >
        {/* Static export: plain <img>, not next/image */}
        <img
          ref={thumbRef}
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
          mediaViewTransitionName={vtName}
          onClose={() => toggleModal(false)}
        />
      )}
    </>
  );
}
