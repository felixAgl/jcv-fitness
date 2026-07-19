import { ArrowDown, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export function SpreadsheetHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 mb-8">
          <FileSpreadsheet className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm text-accent-cyan font-medium">
            Herramienta para entrenadores profesionales
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
          <span className="text-white">HOJA DE</span>{" "}
          <span className="text-accent-cyan">EVALUACION</span>
          <br />
          <span className="text-white">FISICA</span>{" "}
          <span className="text-accent-cyan">PROFESIONAL</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-3xl mx-auto">
          La herramienta definitiva para entrenadores que quieren destacar
        </p>
        <p className="text-base text-gray-500 mb-10 max-w-2xl mx-auto">
          Evalua a tus clientes con precision, genera informes profesionales y demuestra
          que eres un experto de verdad.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="#pricing"
            className="btn-cta inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold"
          >
            DESCARGAR AHORA
            <ArrowDown className="h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-accent-cyan bg-transparent border-2 border-accent-cyan hover:bg-accent-cyan/10 hover:shadow-lg hover:shadow-accent-cyan/30 transition-all hover:scale-105"
          >
            Ver que incluye
          </a>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Compatible con Excel y Google Sheets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan" />
            <span>4 versiones incluidas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Calculos 100% automaticos</span>
          </div>
        </div>
      </div>
    </section>
  );
}
