"use client";

import { FileText, Download, Eye } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { LANDING_STRINGS } from "../i18n";

export function PDFShowcase() {
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].pdfShowcase;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-background-light">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">{t.titlePre}</span>
          <span className="text-accent-cyan">{t.titleHighlight}</span>
          <span className="text-white">{t.titlePost}</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t.subtitle}</p>

        {/* PDF Preview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {t.pages.map((page, index) => (
            <div
              key={page.title}
              className="bg-card border border-gray-800 rounded-2xl p-6 text-center hover:border-accent-cyan/50 transition-colors"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r from-accent-cyan/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-3xl font-black text-accent-cyan">{index + 1}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{page.title}</h3>
              <p className="text-sm text-gray-400">{page.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-card border border-accent-cyan/30 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <FileText className="w-16 h-16 mx-auto mb-4 text-accent-cyan" />
          <h3 className="text-2xl font-bold text-white mb-3">{t.ctaTitle}</h3>
          <p className="text-gray-400 mb-6">{t.ctaText}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plan/view?preview=true"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold border-2 border-accent-cyan text-accent-cyan hover:bg-accent-cyan/10 transition-all"
            >
              <Eye className="w-5 h-5" />
              {t.ctaExample}
            </Link>
            <Link
              href="/wizard"
              className="btn-cta inline-flex items-center justify-center gap-2 px-6 py-3 font-bold"
            >
              <Download className="w-5 h-5" />
              {t.ctaCreate}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
