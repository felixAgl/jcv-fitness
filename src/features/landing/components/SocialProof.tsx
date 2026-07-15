"use client";

import { Star, Users, Download, Trophy } from "lucide-react";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

// Icons zip positionally with LANDING_STRINGS[lang].socialProof.stats.
const statIcons = [Users, Download, Trophy];
const TESTIMONIAL_RATING = 5;

export function SocialProof() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].socialProof;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {t.stats.map((stat, index) => {
            const Icon = statIcons[index];
            return (
              <div
                key={stat.label}
                className="relative overflow-hidden bg-card border border-gray-800 rounded-2xl p-8 text-center hover-lift hover:border-accent-cyan/40"
              >
                <div className="absolute inset-0 wash-cyan pointer-events-none" />
                <div className="relative">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-accent-cyan" />
                  </div>
                  <div className="font-display text-6xl tracking-wide text-accent-cyan mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">{t.titlePre}</span>
          <span className="text-accent-cyan">{t.titleHighlight}</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t.subtitle}</p>

        <div className="grid md:grid-cols-3 gap-6">
          {t.testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-card border border-gray-800 rounded-2xl p-6 hover-lift hover:border-accent-cyan/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.date}</div>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: TESTIMONIAL_RATING }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-400 text-sm">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
