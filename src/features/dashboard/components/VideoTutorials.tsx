"use client";

import Link from "next/link";
import { useSubscription } from "@/features/subscription";

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: "ejercicios" | "nutricion" | "tecnica";
  isPremium: boolean;
}

const TUTORIALS: VideoTutorial[] = [
  {
    id: "1",
    title: "Tecnica correcta de Sentadilla",
    description: "Aprende la forma perfecta para evitar lesiones",
    thumbnail: "/images/tutorials/squat.jpg",
    duration: "8:30",
    category: "tecnica",
    isPremium: false,
  },
  {
    id: "2",
    title: "Press de Banca - Guia Completa",
    description: "Domina el press de banca paso a paso",
    thumbnail: "/images/tutorials/bench.jpg",
    duration: "12:15",
    category: "tecnica",
    isPremium: true,
  },
  {
    id: "3",
    title: "Rutina de Calentamiento",
    description: "Prepara tu cuerpo antes de entrenar",
    thumbnail: "/images/tutorials/warmup.jpg",
    duration: "6:45",
    category: "ejercicios",
    isPremium: false,
  },
  {
    id: "4",
    title: "Nutricion Pre-Entreno",
    description: "Que comer antes de tu sesion",
    thumbnail: "/images/tutorials/preworkout.jpg",
    duration: "10:20",
    category: "nutricion",
    isPremium: true,
  },
];

const categoryColors = {
  ejercicios: { bg: "bg-purple-500/20", text: "text-purple-400" },
  nutricion: { bg: "bg-green-500/20", text: "text-green-400" },
  tecnica: { bg: "bg-accent-cyan/20", text: "text-accent-cyan" },
};

export function VideoTutorials() {
  const { hasActiveSubscription } = useSubscription();

  const visibleTutorials = hasActiveSubscription
    ? TUTORIALS
    : TUTORIALS.filter((t) => !t.isPremium);

  const lockedCount = TUTORIALS.filter((t) => t.isPremium).length;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Video Tutoriales</h3>
        {!hasActiveSubscription && (
          <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
            +{lockedCount} con Premium
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visibleTutorials.slice(0, 3).map((tutorial) => (
          <div
            key={tutorial.id}
            className="flex gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer group"
          >
            {/* Thumbnail placeholder */}
            <div className="w-20 h-14 bg-gray-700 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
              <svg
                className="w-8 h-8 text-gray-500 group-hover:text-accent-cyan transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1 rounded">
                {tutorial.duration}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-white truncate">
                  {tutorial.title}
                </h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                    categoryColors[tutorial.category].bg
                  } ${categoryColors[tutorial.category].text}`}
                >
                  {tutorial.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                {tutorial.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!hasActiveSubscription && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-accent-cyan/10 to-purple-500/10 border border-accent-cyan/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-accent-cyan"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">
                Desbloquea todos los tutoriales
              </p>
              <p className="text-xs text-gray-400">
                Accede a {lockedCount}+ videos exclusivos
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-accent-cyan text-black font-semibold text-sm hover:bg-accent-cyan/90 transition-colors"
            >
              Ver Planes
            </Link>
          </div>
        </div>
      )}

      {hasActiveSubscription && visibleTutorials.length > 3 && (
        <button
          type="button"
          className="w-full mt-4 py-2 text-sm text-accent-cyan hover:text-white transition-colors"
        >
          Ver todos los tutoriales ({visibleTutorials.length})
        </button>
      )}
    </div>
  );
}
