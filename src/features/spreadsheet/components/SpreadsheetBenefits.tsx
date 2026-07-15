import { Award, Clock, Star, Monitor } from "lucide-react";

interface Benefit {
  icon: typeof Award;
  title: string;
  description: string;
}

const benefits: readonly Benefit[] = [
  {
    icon: Award,
    title: "Impresiona a tus clientes",
    description:
      "Entrega informes profesionales que demuestren tu nivel como entrenador. Tus clientes van a notar la diferencia.",
  },
  {
    icon: Clock,
    title: "Ahorra tiempo",
    description:
      "Olvida las calculadoras y las formulas a mano. Todos los calculos se generan automaticamente.",
  },
  {
    icon: Star,
    title: "Destaca como experto",
    description:
      "Diferencia tu servicio del resto. La evaluacion fisica profesional te posiciona como un verdadero especialista.",
  },
  {
    icon: Monitor,
    title: "Funciona en todo dispositivo",
    description:
      "Compatible con celular, tablet y PC. Usa Google Sheets o Excel, como prefieras.",
  },
] as const;

export function SpreadsheetBenefits() {
  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black to-gray-950" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-4">
          <span className="text-white">Por que </span>
          <span className="text-accent-cyan">NECESITAS</span>
          <span className="text-white"> esta herramienta</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          No es solo una hoja de calculo. Es tu arma secreta para ser un entrenador de elite.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="flex gap-6 p-6 rounded-2xl border border-gray-800 bg-gray-900/30 hover:border-accent-cyan/30 transition-all group"
              >
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-blue-500/20 border border-accent-cyan/20 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-accent-cyan group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-accent-cyan font-mono text-sm">
                      0{index + 1}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-accent-cyan transition-colors">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
