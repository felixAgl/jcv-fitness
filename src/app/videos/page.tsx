"use client";

import Link from "next/link";
import Image from "next/image";
import { useSubscription } from "@/features/subscription";
import {
  VIDEO_TUTORIALS,
  getYoutubeThumbnail,
  getYoutubeUrl,
} from "@/features/dashboard/data/video-tutorials";

const categoryColors = {
  ejercicios: { bg: "bg-slate-500/20", text: "text-slate-300" },
  nutricion: { bg: "bg-green-500/20", text: "text-green-400" },
  tecnica: { bg: "bg-accent-cyan/20", text: "text-accent-cyan" },
};

export default function VideosPage() {
  const { hasActiveSubscription, isLoading } = useSubscription();

  const visibleTutorials = hasActiveSubscription
    ? VIDEO_TUTORIALS
    : VIDEO_TUTORIALS.filter((t) => !t.isPremium);

  const lockedTutorials = VIDEO_TUTORIALS.filter((t) => t.isPremium);

  const handleVideoClick = (youtubeId: string) => {
    window.open(getYoutubeUrl(youtubeId), "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Video Tutoriales</h1>
          <p className="text-gray-400">
            {hasActiveSubscription
              ? `${VIDEO_TUTORIALS.length} videos disponibles`
              : `${visibleTutorials.length} videos gratuitos - ${lockedTutorials.length} mas con Premium`}
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTutorials.map((tutorial) => (
            <button
              key={tutorial.id}
              type="button"
              onClick={() => handleVideoClick(tutorial.youtubeId)}
              className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-accent-cyan/50 transition-all group text-left"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-800">
                <Image
                  src={getYoutubeThumbnail(tutorial.youtubeId)}
                  alt={tutorial.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-1 rounded">
                  {tutorial.duration}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-white group-hover:text-accent-cyan transition-colors">
                    {tutorial.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                      categoryColors[tutorial.category].bg
                    } ${categoryColors[tutorial.category].text}`}
                  >
                    {tutorial.category}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{tutorial.description}</p>
                <p className="text-xs text-gray-600 mt-2">{tutorial.channel}</p>
              </div>
            </button>
          ))}

          {/* Locked Videos Preview */}
          {!hasActiveSubscription &&
            lockedTutorials.slice(0, 3).map((tutorial) => (
              <div
                key={tutorial.id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden opacity-60 relative"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  <Image
                    src={getYoutubeThumbnail(tutorial.youtubeId)}
                    alt={tutorial.title}
                    fill
                    className="object-cover blur-sm"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-500">{tutorial.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">Premium</p>
                </div>
              </div>
            ))}
        </div>

        {/* Upgrade CTA */}
        {!hasActiveSubscription && (
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-accent-cyan/10 to-blue-500/10 border border-accent-cyan/20 text-center">
            <div className="w-16 h-16 bg-accent-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Desbloquea todos los tutoriales</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Accede a {lockedTutorials.length} videos exclusivos de entrenamiento, tecnica y nutricion
              con tu suscripcion Premium.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-8 py-3 rounded-xl bg-accent-cyan text-black font-bold hover:bg-accent-cyan/90 transition-colors"
            >
              Ver Planes Premium
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
