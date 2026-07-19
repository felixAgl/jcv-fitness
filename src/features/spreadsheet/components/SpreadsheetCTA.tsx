import { ArrowDown, FileSpreadsheet } from "lucide-react";

export function SpreadsheetCTA() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-black" />

      {/* Decorative blurs */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-8 md:p-16 backdrop-blur-sm">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-blue-500/20 border border-accent-cyan/20 flex items-center justify-center mx-auto mb-8">
            <FileSpreadsheet className="w-10 h-10 text-accent-cyan" />
          </div>

          {/* Content */}
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">Descarga tu hoja de </span>
            <span className="text-accent-cyan">evaluacion</span>
            <span className="text-white"> ahora</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Empieza a evaluar a tus clientes como un profesional.
            No necesitas experiencia previa con hojas de calculo.
          </p>

          {/* CTA Button */}
          <a
            href="#pricing"
            className="btn-cta inline-flex items-center justify-center gap-2 px-10 py-5 text-xl font-bold"
          >
            DESCARGAR AHORA
            <ArrowDown className="h-6 w-6" />
          </a>

          {/* Trust note */}
          <p className="text-sm text-gray-500 mt-6">
            Compatible con Google Sheets y Microsoft Excel.
            Funciona en celular, tablet y PC.
          </p>
        </div>
      </div>
    </section>
  );
}
