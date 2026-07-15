"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getExerciseMedia } from "@/features/wizard/data/exercise-media";
import { exercises } from "@/features/wizard/data/exercises";
import {
  loadExerciseLibrary,
  getLibraryExercise,
  extractDatasetId,
  type Lang,
  type LibraryExercise,
} from "@/features/exercises";
import { useLanguage } from "@/features/shared/hooks/useLanguage";

interface ExerciseDetailModalProps {
  exerciseId: string;
  name: string;
  altName?: string;
  /**
   * view-transition-name shared with the thumb that opened the modal, so the
   * browser can morph thumb -> modal media (see ExerciseMediaThumb).
   */
  mediaViewTransitionName?: string;
  onClose: () => void;
}

/** UI strings for the modal, per language. */
const STRINGS: Record<Lang, { muscles: string; instructions: string; close: string; loading: string }> = {
  es: {
    muscles: "Músculos trabajados",
    instructions: "Instrucciones",
    close: "Cerrar",
    loading: "Cargando detalles...",
  },
  en: {
    muscles: "Muscles worked",
    instructions: "Instructions",
    close: "Close",
    loading: "Loading details...",
  },
};

/** EN dataset muscle names -> Spanish labels. */
const MUSCLE_ES: Record<string, string> = {
  lats: "Dorsales",
  pectorals: "Pectorales",
  delts: "Hombros",
  quads: "Cuádriceps",
  glutes: "Glúteos",
  hamstrings: "Isquiotibiales",
  calves: "Pantorrillas",
  abs: "Abdominales",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  traps: "Trapecios",
  "upper back": "Espalda alta",
  "lower back": "Espalda baja",
  spine: "Espalda baja",
  adductors: "Aductores",
  abductors: "Abductores",
  "cardiovascular system": "Cardio",
  "serratus anterior": "Serrato",
  "levator scapulae": "Elevador de la escápula",
  // secondary_muscles uses a wider vocabulary than target
  shoulders: "Hombros",
  quadriceps: "Cuádriceps",
  chest: "Pectorales",
  "hip flexors": "Flexores de cadera",
  core: "Core",
  obliques: "Oblicuos",
  rhomboids: "Romboides",
  trapezius: "Trapecios",
  deltoids: "Hombros",
  "rear deltoids": "Hombro posterior",
  brachialis: "Braquial",
  back: "Espalda",
  ankles: "Tobillos",
  feet: "Pies",
  "rotator cuff": "Manguito rotador",
  "latissimus dorsi": "Dorsales",
  "ankle stabilizers": "Tobillos",
  soleus: "Sóleo",
  wrists: "Muñecas",
  "upper chest": "Pectoral superior",
  "wrist flexors": "Muñecas",
  "wrist extensors": "Muñecas",
  abdominals: "Abdominales",
  sternocleidomastoid: "Cuello",
  hands: "Manos",
  groin: "Ingle",
  "grip muscles": "Agarre",
  "lower abs": "Abdominales bajos",
  "inner thighs": "Aductores",
  shins: "Espinillas",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function muscleLabel(muscle: string, lang: Lang): string {
  const key = muscle.toLowerCase();
  if (lang === "es") return MUSCLE_ES[key] ?? capitalize(muscle);
  return capitalize(muscle);
}

/**
 * Step-by-step instructions with fallbacks: steps in the active language,
 * then the paragraph in the active language (as a single step), then the
 * other language, then nothing (section hidden).
 */
function getInstructionSteps(ex: LibraryExercise, lang: Lang): string[] {
  const other: Lang = lang === "es" ? "en" : "es";
  const candidates = [
    ex.instruction_steps?.[lang],
    ex.instructions?.[lang] ? [ex.instructions[lang]] : undefined,
    ex.instruction_steps?.[other],
    ex.instructions?.[other] ? [ex.instructions[other]] : undefined,
  ];
  for (const steps of candidates) {
    if (steps && steps.length > 0) return steps;
  }
  return [];
}

/**
 * Full-detail modal for an exercise: animated GIF demo (JPG placeholder while
 * it loads), muscle badges and step-by-step instructions from the exercise
 * library, with an ES/EN toggle. Follows the AuthModal portal pattern plus
 * Escape-to-close and body scroll-lock.
 */
export function ExerciseDetailModal({
  exerciseId,
  name,
  altName,
  mediaViewTransitionName,
  onClose,
}: ExerciseDetailModalProps) {
  const media = getExerciseMedia(exerciseId);
  const { lang, setLang } = useLanguage();
  const t = STRINGS[lang];
  // In EN mode show the catalog's English techName as the title
  const catalogExercise = exercises.find((e) => e.id === exerciseId);
  const displayName = lang === "en" ? catalogExercise?.techName ?? name : name;
  const displayAltName = lang === "en" ? undefined : altName;

  const [mounted, setMounted] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [libraryExercise, setLibraryExercise] = useState<LibraryExercise | null>(null);
  const [libraryState, setLibraryState] = useState<"loading" | "ready" | "error">("loading");

  // Layout effect (not passive) so that when the opener wraps this mount in
  // document.startViewTransition + flushSync, the portal content is in the
  // DOM before the new-state snapshot is captured.
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Scroll-lock + Escape to close (existing modals lack this; required here).
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Lazy-load the exercise library (fetched once per session, cached in the
  // service) and resolve this exercise by its dataset id.
  useEffect(() => {
    const datasetId = media ? extractDatasetId(media.image) : undefined;
    if (!datasetId) {
      setLibraryState("error");
      return;
    }
    let cancelled = false;
    loadExerciseLibrary()
      .then((list) => {
        if (cancelled) return;
        setLibraryExercise(getLibraryExercise(list, datasetId) ?? null);
        setLibraryState("ready");
      })
      .catch(() => {
        // Library fetch failed: the modal still shows the GIF (graceful).
        if (!cancelled) setLibraryState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [media]);

  if (!mounted) return null;

  const muscles = libraryExercise
    ? [libraryExercise.target, ...libraryExercise.secondary_muscles]
    : [];
  const steps = libraryExercise ? getInstructionSteps(libraryExercise, lang) : [];

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        data-testid="exercise-modal-backdrop"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={displayName}
        className="relative bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-[480px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header: name + ES/EN pill + close */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-bold text-lg leading-tight truncate">{displayName}</h2>
            {displayAltName && <p className="text-gray-500 text-xs truncate">{displayAltName}</p>}
          </div>

          <div
            className="flex rounded-full border border-gray-700 overflow-hidden text-xs font-semibold shrink-0"
            role="group"
            aria-label="Idioma / Language"
          >
            <button
              type="button"
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
              className={`px-2.5 py-1 transition-colors ${
                lang === "es" ? "bg-accent-cyan text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`px-2.5 py-1 transition-colors ${
                lang === "en" ? "bg-accent-cyan text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="text-gray-500 hover:text-white transition-colors shrink-0"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Media: Gymvisual GIFs have a white background, so the container is white */}
        {media && (
          <div
            className="relative bg-white aspect-square w-full max-h-[45vh] shrink-0"
            style={mediaViewTransitionName ? { viewTransitionName: mediaViewTransitionName } : undefined}
          >
            {/* Static export: plain <img>, not next/image. JPG is already cached from the thumb. */}
            <img
              src={media.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <img
              src={media.gif}
              alt={name}
              onLoad={() => setGifLoaded(true)}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                gifLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
            {!gifLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  data-testid="gif-spinner"
                  className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"
                />
              </div>
            )}
          </div>
        )}

        {/* Details (scrollable) */}
        <div className="overflow-y-auto p-4 space-y-4">
          {libraryState === "loading" && (
            <div className="space-y-2" aria-label={t.loading}>
              <div className="h-4 w-40 bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-800 rounded animate-pulse" />
            </div>
          )}

          {libraryState !== "loading" && muscles.length > 0 && (
            <section>
              <h3 className="text-white font-semibold text-sm mb-2">{t.muscles}</h3>
              <div className="flex flex-wrap gap-1.5">
                {muscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="px-2.5 py-1 rounded-full bg-accent-cyan/15 text-accent-cyan text-xs font-medium"
                  >
                    {muscleLabel(muscle, lang)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {libraryState !== "loading" && steps.length > 0 && (
            <section>
              <h3 className="text-white font-semibold text-sm mb-2">{t.instructions}</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-sm leading-relaxed">
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
