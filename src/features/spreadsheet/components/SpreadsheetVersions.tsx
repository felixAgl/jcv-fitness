import { User, Activity, Check } from "lucide-react";

interface Version {
  title: string;
  subtitle: string;
  gender: "male" | "female";
  method: "adipometer" | "bioimpedance";
  features: readonly string[];
}

const versions: readonly Version[] = [
  {
    title: "Masculino + Adipometro",
    subtitle: "Metodo Pollock 7 pliegues",
    gender: "male",
    method: "adipometer",
    features: [
      "Pliegues cutaneos (7 sitios)",
      "Densidad corporal Pollock",
      "% grasa Jackson-Pollock",
      "Perimetria completa",
      "Composicion corporal",
      "Graficos de progreso",
    ],
  },
  {
    title: "Femenino + Adipometro",
    subtitle: "Metodo Pollock 7 pliegues",
    gender: "female",
    method: "adipometer",
    features: [
      "Pliegues cutaneos (7 sitios)",
      "Formula adaptada mujer",
      "% grasa Jackson-Pollock",
      "Perimetria completa",
      "Composicion corporal",
      "Graficos de progreso",
    ],
  },
  {
    title: "Masculino + Bioimpedancia",
    subtitle: "Datos de balanza inteligente",
    gender: "male",
    method: "bioimpedance",
    features: [
      "Input de bioimpedancia",
      "Masa muscular esqueletica",
      "Grasa visceral",
      "Perimetria completa",
      "Composicion corporal",
      "Graficos de progreso",
    ],
  },
  {
    title: "Femenino + Bioimpedancia",
    subtitle: "Datos de balanza inteligente",
    gender: "female",
    method: "bioimpedance",
    features: [
      "Input de bioimpedancia",
      "Masa muscular esqueletica",
      "Grasa visceral",
      "Perimetria completa",
      "Composicion corporal",
      "Graficos de progreso",
    ],
  },
] as const;

function GenderIcon({ gender }: { gender: "male" | "female" }) {
  const color = gender === "male" ? "text-blue-400" : "text-pink-400";
  return <User className={`w-6 h-6 ${color}`} />;
}

function MethodIcon({ method }: { method: "adipometer" | "bioimpedance" }) {
  const color = method === "adipometer" ? "text-orange-400" : "text-green-400";
  return <Activity className={`w-6 h-6 ${color}`} />;
}

function getCardBorderAccent(gender: "male" | "female"): string {
  return gender === "male"
    ? "hover:border-blue-400/50"
    : "hover:border-pink-400/50";
}

function getIconBg(gender: "male" | "female"): string {
  return gender === "male"
    ? "from-blue-500/20 to-blue-900/20"
    : "from-pink-500/20 to-pink-900/20";
}

export function SpreadsheetVersions() {
  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-4">
          <span className="text-white">4 </span>
          <span className="text-accent-cyan">VERSIONES</span>
          <span className="text-white"> incluidas</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          Cada version adaptada al genero y metodo de medicion. Recibes las 4 al descargar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {versions.map((version) => (
            <div
              key={version.title}
              className={`rounded-2xl border border-gray-800 bg-gray-900/40 p-6 transition-all group ${getCardBorderAccent(version.gender)}`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIconBg(version.gender)} border border-gray-700 flex items-center justify-center`}
                >
                  <GenderIcon gender={version.gender} />
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIconBg(version.gender)} border border-gray-700 flex items-center justify-center`}
                >
                  <MethodIcon method={version.method} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-1">
                {version.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{version.subtitle}</p>

              {/* Features list */}
              <ul className="space-y-2">
                {version.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-400"
                  >
                    <Check className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
