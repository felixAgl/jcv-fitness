"use client";

import { Dumbbell, Utensils, Calendar, Target, Download, Trophy } from "lucide-react";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

// Icons zip positionally with LANDING_STRINGS[lang].features.items.
const featureIcons = [Target, Dumbbell, Utensils, Calendar, Download, Trophy];

const badgeClasses = "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30";

export function FeaturesGrid() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].features;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">{t.titlePre}</span>
          <span className="text-accent-cyan">{t.titleHighlight}</span>
          <span className="text-white">{t.titlePost}</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t.subtitle}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.items.map((feature, index) => {
            const Icon = featureIcons[index];
            const colors = badgeClasses;

            return (
              <div
                key={feature.title}
                className="bg-card border border-gray-800 rounded-2xl p-6 hover:border-accent-cyan/50 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl ${colors} flex items-center justify-center mb-4 border`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-cyan transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
