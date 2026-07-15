"use client";

import Link from "next/link";
import Image from "next/image";
import { useSubscription } from "@/features/subscription";
import {
  VIDEO_TUTORIALS,
  getYoutubeThumbnail,
  getYoutubeUrl,
} from "../data/video-tutorials";

const categoryColors = {
  ejercicios: { bg: "bg-slate-500/20", text: "text-slate-300" },
  nutricion: { bg: "bg-slate-500/20", text: "text-slate-300" },
  tecnica: { bg: "bg-accent-cyan/20", text: "text-accent-cyan" },
};

export function VideoTutorials() {
  const { hasActiveSubscription } = useSubscription();

  const visibleTutorials = hasActiveSubscription
    ? VIDEO_TUTORIALS
    : VIDEO_TUTORIALS.filter((t) => !t.isPremium);

  const lockedCount = VIDEO_TUTORIALS.filter((t) => t.isPremium).length;

  const handleVideoClick = (youtubeId: string) => {
    window.open(getYoutubeUrl(youtubeId), "_blank", "noopener,noreferrer");
  };

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
          <button
            key={tutorial.id}
            type="button"
            onClick={() => handleVideoClick(tutorial.youtubeId)}
            className="w-full flex gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer group text-left"
          >
            {/* YouTube Thumbnail */}
            <div className="w-24 h-14 bg-gray-700 rounded-lg shrink-0 relative overflow-hidden">
              <Image
                src={getYoutubeThumbnail(tutorial.youtubeId)}
                alt={tutorial.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="96px"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1 rounded">
                {tutorial.duration}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-white truncate group-hover:text-accent-cyan transition-colors">
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
              <p className="text-[10px] text-gray-600 mt-1">
                {tutorial.channel}
              </p>
            </div>
          </button>
        ))}
      </div>

      {!hasActiveSubscription && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-accent-cyan/10 to-blue-500/10 border border-accent-cyan/20">
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
        <Link
          href="/videos"
          className="block w-full mt-4 py-2 text-sm text-accent-cyan hover:text-white transition-colors text-center"
        >
          Ver todos los tutoriales ({visibleTutorials.length})
        </Link>
      )}
    </div>
  );
}
