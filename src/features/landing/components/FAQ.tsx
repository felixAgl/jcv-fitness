"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].faq;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-background-light">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">{t.titlePre}</span>
          <span className="text-accent-cyan">{t.titleHighlight}</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12">{t.subtitle}</p>

        <div className="space-y-4">
          {t.items.map((faq, index) => (
            <div
              key={index}
              className="bg-card border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-bold text-white pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-accent-cyan flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
