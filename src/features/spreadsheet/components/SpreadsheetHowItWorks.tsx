import { ClipboardEdit, Cpu, Download } from "lucide-react";

interface Step {
  icon: typeof ClipboardEdit;
  number: string;
  title: string;
  description: string;
  accent: string;
}

const steps: readonly Step[] = [
  {
    icon: ClipboardEdit,
    number: "01",
    title: "Ingresa los datos",
    description:
      "Registra los datos del cliente: peso, talla, pliegues cutaneos, perimetros y demas medidas necesarias.",
    accent: "text-accent-cyan",
  },
  {
    icon: Cpu,
    number: "02",
    title: "Calculos automaticos",
    description:
      "La hoja calcula automaticamente IMC, porcentaje de grasa, masa magra, masa grasa y genera graficos comparativos.",
    accent: "text-accent-green",
  },
  {
    icon: Download,
    number: "03",
    title: "Descarga el informe",
    description:
      "Genera un PDF profesional con todos los resultados y entregalo a tu cliente. Asi de simple.",
    accent: "text-accent-red",
  },
] as const;

export function SpreadsheetHowItWorks() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-black" />

      {/* Decorative line connecting steps */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent hidden lg:block" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-4">
          <span className="text-white">Como </span>
          <span className="text-accent-green">FUNCIONA</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          Tres pasos simples. Cero complicaciones.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative text-center p-8 rounded-2xl border border-gray-800 bg-gray-900/40 hover:border-accent-cyan/30 transition-all group"
              >
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-4 py-1 bg-black border border-gray-700 rounded-full text-sm font-mono text-gray-500 group-hover:border-accent-cyan/50 group-hover:text-accent-cyan transition-colors">
                    Paso {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center mx-auto mb-6 mt-4 group-hover:border-accent-cyan/30 transition-colors">
                  <Icon className={`w-10 h-10 ${step.accent}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-cyan transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
