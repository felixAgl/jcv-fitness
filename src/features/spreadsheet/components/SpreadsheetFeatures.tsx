import {
  Ruler,
  Activity,
  CircleDot,
  Scale,
  ClipboardList,
  BarChart3,
  FileText,
  Camera,
} from "lucide-react";

const CYAN_BADGE = "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30";

const FEATURE_COLORS = {
  cyan: CYAN_BADGE,
  red: CYAN_BADGE,
  green: CYAN_BADGE,
  purple: CYAN_BADGE,
  orange: CYAN_BADGE,
  yellow: CYAN_BADGE,
  blue: CYAN_BADGE,
  pink: CYAN_BADGE,
} as const;

type FeatureColor = keyof typeof FEATURE_COLORS;

interface Feature {
  icon: typeof Ruler;
  title: string;
  description: string;
  color: FeatureColor;
}

const features: readonly Feature[] = [
  {
    icon: Ruler,
    title: "Evaluacion Antropometrica",
    description:
      "Peso, talla, IMC automatico y todos los datos basicos del cliente en un solo lugar.",
    color: "cyan",
  },
  {
    icon: Activity,
    title: "Grasa Corporal",
    description:
      "Calculo con metodo Pollock 7 pliegues y bioimpedancia. Resultados precisos al instante.",
    color: "red",
  },
  {
    icon: CircleDot,
    title: "Perimetria Completa",
    description:
      "Medidas de todas las circunferencias corporales organizadas y con historial.",
    color: "green",
  },
  {
    icon: Scale,
    title: "Composicion Corporal",
    description:
      "Desglose detallado de masa magra vs masa grasa con porcentajes automaticos.",
    color: "purple",
  },
  {
    icon: ClipboardList,
    title: "Anamnesis del Cliente",
    description:
      "Historial de salud, lesiones previas, medicamentos y antecedentes completos.",
    color: "orange",
  },
  {
    icon: BarChart3,
    title: "Graficos Comparativos",
    description:
      "Graficos automaticos que muestran la evolucion del cliente de forma visual.",
    color: "blue",
  },
  {
    icon: FileText,
    title: "Informe PDF Profesional",
    description:
      "Genera un PDF con el logo de tu marca listo para entregar al cliente.",
    color: "yellow",
  },
  {
    icon: Camera,
    title: "Seguimiento con Fotos",
    description:
      "Espacio para fotos de progreso (frente, lateral, espalda) en cada evaluacion.",
    color: "pink",
  },
] as const;

export function SpreadsheetFeatures() {
  return (
    <section id="features" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-4">
          <span className="text-white">Que </span>
          <span className="text-accent-cyan">INCLUYE</span>
          <span className="text-white"> la hoja</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Todo lo que necesitas para hacer evaluaciones fisicas de nivel profesional
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors = FEATURE_COLORS[feature.color];

            return (
              <div
                key={feature.title}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-accent-cyan/50 transition-all group backdrop-blur-sm"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${colors} flex items-center justify-center mb-4 border`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-cyan transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
