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
import { MuscleAtlas, hasAtlasRegion, pickAtlasView } from "@/shared/components/MuscleAtlas";
import { buildSparklinePoints, getSessionMaxes } from "../services/workout-log";
import type { LoggedSet } from "../types";

interface ExerciseDetailModalProps {
  exerciseId: string;
  name: string;
  altName?: string;
  /**
   * view-transition-name shared with the thumb that opened the modal, so the
   * browser can morph thumb -> modal media (see ExerciseMediaThumb).
   */
  mediaViewTransitionName?: string;
  /**
   * Optional workout log (all exercises). When sets exist for this exercise a
   * compact "Fuerza" trend section renders: last 8 sessions max weight as a
   * pure-SVG sparkline plus the current max in Bebas.
   */
  workoutLog?: LoggedSet[];
  onClose: () => void;
}

/** UI strings for the modal, per language. */
const STRINGS: Record<
  Lang,
  { muscles: string; instructions: string; close: string; loading: string; strength: string; sessions: string }
> = {
  es: {
    muscles: "Músculos trabajados",
    instructions: "Instrucciones",
    close: "Cerrar",
    loading: "Cargando detalles...",
    strength: "Fuerza",
    sessions: "sesiones",
  },
  en: {
    muscles: "Muscles worked",
    instructions: "Instructions",
    close: "Close",
    loading: "Loading details...",
    strength: "Strength",
    sessions: "sessions",
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
 * Full-detail modal for an exercise: looping MP4 demo (WebP poster + JPG
 * placeholder while it loads, GIF fallback if the MP4 fails), muscle badges
 * and step-by-step instructions from the exercise
 * library, with an ES/EN toggle. Follows the AuthModal portal pattern plus
 * Escape-to-close and body scroll-lock.
 */
export function ExerciseDetailModal({
  exerciseId,
  name,
  altName,
  mediaViewTransitionName,
  workoutLog,
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
  // MP4 failed (missing transcode, unsupported codec...): fall back to the GIF.
  const [videoFailed, setVideoFailed] = useState(false);
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
  // Muscle atlas: primary = dataset target, secondary = secondary_muscles.
  // The view (front/back) is auto-picked by pickAtlasView's documented
  // anterior/posterior weighted vote; hidden when nothing maps to a region.
  const atlasPrimary = libraryExercise ? [libraryExercise.target] : [];
  const atlasSecondary = libraryExercise?.secondary_muscles ?? [];
  const showAtlas = muscles.length > 0 && hasAtlasRegion(muscles);
  const atlasView = showAtlas ? pickAtlasView(atlasPrimary, atlasSecondary) : "front";
  const steps = libraryExercise ? getInstructionSteps(libraryExercise, lang) : [];

  // "Fuerza" mini-chart: last 8 sessions max weight (pure SVG, no chart lib).
  const sessionMaxes = workoutLog ? getSessionMaxes(workoutLog, exerciseId, 8) : [];
  const currentMax = sessionMaxes.length > 0
    ? Math.max(...sessionMaxes.map((s) => s.maxWeightKg))
    : 0;
  const sparklinePoints = buildSparklinePoints(
    sessionMaxes.map((s) => s.maxWeightKg),
    160,
    48
  );

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
            {/* Static export: plain <img>/<video>, not next/image. JPG is already cached from the thumb. */}
            <img
              src={media.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {!videoFailed ? (
              /* MP4 transcode (85-95% lighter than the GIF), WebP first frame as poster. */
              <video
                src={media.mp4}
                poster={media.poster}
                autoPlay
                loop
                muted
                playsInline
                aria-label={name}
                data-testid="exercise-video"
                onLoadedData={() => setGifLoaded(true)}
                onError={() => setVideoFailed(true)}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                  gifLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              /* GIF fallback when the MP4 cannot be loaded/played. */
              <img
                src={media.gif}
                alt={name}
                onLoad={() => setGifLoaded(true)}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                  gifLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
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
          {/* Fuerza trend from the workout log (idea #10) */}
          {sessionMaxes.length > 0 && (
            <section data-testid="strength-trend">
              <h3 className="text-white font-semibold text-sm mb-2">{t.strength}</h3>
              <div className="flex items-center gap-4 bg-white/5 ring-1 ring-white/10 rounded-xl p-3">
                <div className="shrink-0">
                  <div className="font-display text-4xl tracking-wide text-accent-cyan leading-none">
                    {Math.round(currentMax * 10) / 10}
                    <span className="text-lg ml-0.5">kg</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                    {sessionMaxes.length} {t.sessions}
                  </div>
                </div>
                <svg
                  viewBox="0 0 160 48"
                  className="flex-1 h-12"
                  role="img"
                  aria-label={`${t.strength}: ${sessionMaxes
                    .map((s) => `${s.maxWeightKg}kg`)
                    .join(", ")}`}
                >
                  <polyline
                    points={sparklinePoints}
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sessionMaxes.length === 1 && (
                    <circle cx="80" cy="24" r="3" fill="var(--accent-cyan)" />
                  )}
                </svg>
              </div>
            </section>
          )}

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
              <div className="flex items-start gap-3">
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {muscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-2.5 py-1 rounded-full bg-accent-cyan/15 text-accent-cyan text-xs font-medium"
                    >
                      {muscleLabel(muscle, lang)}
                    </span>
                  ))}
                </div>
                {showAtlas && (
                  <MuscleAtlas
                    view={atlasView}
                    primary={atlasPrimary}
                    secondary={atlasSecondary}
                    className="w-14 h-28 shrink-0"
                    title={lang === "es" ? "Mapa muscular" : "Muscle map"}
                  />
                )}
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
