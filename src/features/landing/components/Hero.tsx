"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Dumbbell, Utensils, Play } from "lucide-react";
import { useState } from "react";

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden">
      <div className="bg-pattern" />
      <div className="bg-particles" />

      {/* Background transformation photos - very subtle, decorative only */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
        <div className="absolute left-0 top-1/4 w-56 h-72 opacity-[0.08] blur-sm -rotate-6">
          <Image
            src="/images/transformations/camilo-before.jpg"
            alt=""
            fill
            className="object-cover rounded-3xl"
            sizes="224px"
            unoptimized
          />
        </div>
        <div className="absolute right-0 top-1/4 w-56 h-72 opacity-[0.08] blur-sm rotate-6">
          <Image
            src="/images/transformations/camilo-after.jpg"
            alt=""
            fill
            className="object-cover rounded-3xl"
            sizes="224px"
            unoptimized
          />
        </div>
        <div className="absolute left-8 bottom-20 w-40 h-52 opacity-[0.05] blur-sm -rotate-3">
          <Image
            src="/images/transformations/result-2.jpg"
            alt=""
            fill
            className="object-cover rounded-3xl"
            sizes="160px"
            unoptimized
          />
        </div>
        <div className="absolute right-8 bottom-20 w-40 h-52 opacity-[0.05] blur-sm rotate-3">
          <Image
            src="/images/transformations/result-3.jpg"
            alt=""
            fill
            className="object-cover rounded-3xl"
            sizes="160px"
            unoptimized
          />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black mb-6">
          <span className="text-white">TRANSFORMA TU</span>{" "}
          <span className="text-accent-cyan glow-cyan">CUERPO</span>
          <br />
          <span className="text-white">TRANSFORMA TU</span>{" "}
          <span className="text-accent-cyan glow-cyan">VIDA</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Plan de alimentacion y entrenamiento personalizado. Resultados reales con JCV Fitness.
        </p>

        {/* Video Preview */}
        <div className="mb-8 max-w-3xl mx-auto">
          {!showVideo ? (
            <button
              onClick={() => setShowVideo(true)}
              className="relative w-full aspect-video bg-card border border-gray-800 rounded-2xl overflow-hidden group hover:border-accent-cyan/50 transition-colors"
            >
              {/* Thumbnail placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/20 to-blue-500/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-accent-cyan/20 flex items-center justify-center group-hover:bg-accent-cyan/30 transition-colors">
                  <Play className="w-10 h-10 text-accent-cyan fill-accent-cyan" />
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-gray-400 text-sm">
                Mira como funciona en 1 minuto
              </p>
            </button>
          ) : (
            <div className="relative w-full aspect-video bg-card border border-gray-800 rounded-2xl overflow-hidden">
              <video
                autoPlay
                controls
                className="w-full h-full object-cover"
                src="/videos/promo.mp4"
              >
                Tu navegador no soporta videos.
              </video>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/wizard"
            className="btn-cta inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold"
          >
            COMENZAR AHORA
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#pricing"
            className="relative inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-accent-cyan bg-transparent border-2 border-accent-cyan hover:bg-accent-cyan/10 hover:shadow-lg hover:shadow-accent-cyan/30 transition-all hover:scale-105"
          >
            Ver planes
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-cyan rounded-full animate-pulse" />
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Utensils className="h-5 w-5 text-accent-cyan" />
            <span>Plan nutricional</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Dumbbell className="h-5 w-5 text-accent-cyan" />
            <span>Rutinas de ejercicio</span>
          </div>
        </div>
      </div>
    </section>
  );
}
