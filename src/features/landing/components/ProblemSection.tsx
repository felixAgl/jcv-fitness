"use client";

import Image from "next/image";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

export function ProblemSection() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].problem;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-background-light relative overflow-hidden">
      {/* Subtle background photo - faded large result image */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -right-32 top-0 bottom-0 w-96 opacity-[0.04] blur-md">
          <Image
            src="/images/transformations/result-3.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="384px"
            unoptimized
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">{t.titlePre}</span>
          <span className="text-accent-cyan">{t.titleHighlight}</span>
          <span className="text-white">{t.titlePost}</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t.subtitle}</p>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Before */}
          <div className="bg-card border border-red-500/30 rounded-2xl overflow-hidden">
            {/* Photo */}
            <div className="relative h-48 w-full bg-red-500/10">
              <Image
                src="/images/transformations/camilo-before.jpg"
                alt={t.beforeAlt}
                fill
                className="object-cover object-top opacity-70"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-red-500/80 rounded-full text-white text-xs font-bold uppercase tracking-wider">
                {t.beforeBadge}
              </div>
            </div>
            <div className="p-6">
              <ul className="text-gray-400 space-y-2 text-left">
                {t.beforeItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0">x</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 flex items-center justify-center animate-pulse">
                <span className="text-2xl font-black text-white">{t.vs}</span>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-accent-cyan/20 to-blue-500/20 rounded-full blur-xl -z-10" />
            </div>
          </div>

          {/* After */}
          <div className="bg-card border border-accent-cyan/30 rounded-2xl overflow-hidden">
            {/* Photo */}
            <div className="relative h-48 w-full bg-accent-cyan/10">
              <Image
                src="/images/transformations/camilo-after.jpg"
                alt={t.afterAlt}
                fill
                className="object-cover object-top opacity-80"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-accent-cyan/80 rounded-full text-black text-xs font-bold uppercase tracking-wider">
                {t.afterBadge}
              </div>
            </div>
            <div className="p-6">
              <ul className="text-gray-400 space-y-2 text-left">
                {t.afterItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-400 font-bold shrink-0">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
