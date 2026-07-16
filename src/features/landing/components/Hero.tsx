"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Dumbbell, Utensils, Play, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].hero;
  const guarantee = LANDING_STRINGS[lang].guarantee;

  return (
    // id="hero" is observed by StickyCTABar to know when to slide in.
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden"
    >
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
          <span className="text-white">{t.titleLine1Pre}</span>{" "}
          <span className="text-accent-cyan glow-cyan">{t.titleLine1Highlight}</span>
          <br />
          <span className="text-white">{t.titleLine2Pre}</span>{" "}
          <span className="text-accent-cyan glow-cyan">{t.titleLine2Highlight}</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">{t.subtitle}</p>

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
                {t.videoCaption}
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
                {t.videoNotSupported}
              </video>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/wizard"
            className="btn-cta inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold"
          >
            {t.ctaStart}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#pricing"
            className="relative inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-accent-cyan bg-transparent border-2 border-accent-cyan hover:bg-accent-cyan/10 hover:shadow-lg hover:shadow-accent-cyan/30 transition-all hover:scale-105"
          >
            {t.ctaPlans}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-cyan rounded-full animate-pulse" />
          </a>
        </div>

        {/* Compact guarantee badge.
            NOTE: 40-day guarantee is a business commitment pending owner
            confirmation before production. */}
        <div className="flex justify-center -mt-6 mb-12">
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-card/50 text-sm text-gray-400">
            <ShieldCheck className="h-4 w-4 text-accent-cyan shrink-0" />
            {guarantee.text}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Utensils className="h-5 w-5 text-accent-cyan" />
            <span>{t.badgeNutrition}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Dumbbell className="h-5 w-5 text-accent-cyan" />
            <span>{t.badgeWorkout}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
