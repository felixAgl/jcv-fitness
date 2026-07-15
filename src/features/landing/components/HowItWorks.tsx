"use client";

import { ClipboardList, Wand2, FileDown } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

// Icons zip positionally with LANDING_STRINGS[lang].howItWorks.steps.
const stepIcons = [ClipboardList, Wand2, FileDown];

export function HowItWorks() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].howItWorks;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background-light to-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-accent-cyan">{t.titleHighlight}</span>
          <span className="text-white">{t.titlePost}</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t.subtitle}</p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {t.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <div key={step.title} className="relative">
                {/* Connector line */}
                {index < t.steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-accent-cyan/50 to-transparent" />
                )}

                <div className="bg-card border border-gray-800 rounded-2xl p-8 text-center relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{index + 1}</span>
                  </div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/wizard"
            className="btn-cta inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-bold"
          >
            {t.cta}
          </Link>
          <p className="text-gray-500 mt-4 text-sm">{t.ctaNote}</p>
        </div>
      </div>
    </section>
  );
}
