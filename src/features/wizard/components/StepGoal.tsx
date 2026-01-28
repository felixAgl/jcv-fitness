"use client";

import { useWizardStore } from "../store/wizard-store";
import type { TrainingGoal, GoalOption } from "../types";
import { OptionCard } from "./OptionCard";
import { NavigationButtons } from "./NavigationButtons";

const GOAL_OPTIONS: GoalOption[] = [
  {
    value: "perder_grasa",
    label: "Quemar Grasa",
    emoji: "🔥",
    description: "Reducir porcentaje de grasa corporal y definir musculos",
    color: "red",
  },
  {
    value: "ganar_musculo",
    label: "Ganar Musculo",
    emoji: "💪",
    description: "Aumentar masa muscular y fuerza de forma progresiva",
    color: "blue",
  },
  {
    value: "tonificar",
    label: "Tonificar",
    emoji: "✨",
    description: "Definir musculos manteniendo un cuerpo atletico",
    color: "cyan",
  },
  {
    value: "resistencia",
    label: "Resistencia",
    emoji: "🏃",
    description: "Mejorar capacidad cardiovascular y aguante fisico",
    color: "green",
  },
  {
    value: "flexibilidad",
    label: "Flexibilidad",
    emoji: "🧘",
    description: "Aumentar rango de movimiento y prevenir lesiones",
    color: "purple",
  },
  {
    value: "fuerza",
    label: "Fuerza Pura",
    emoji: "🏋️",
    description: "Maximizar fuerza en levantamientos compuestos",
    color: "orange",
  },
  {
    value: "energia",
    label: "Más Energía",
    emoji: "⚡",
    description: "Sentirte con más vitalidad en el día a día",
    color: "yellow",
  },
  {
    value: "salud",
    label: "Salud General",
    emoji: "❤️",
    description: "Mejorar salud cardiovascular y bienestar general",
    color: "pink",
  },
];

export function StepGoal() {
  const { goal, setGoal, nextStep, prevStep, canProceed } = useWizardStore();

  const handleSelect = (value: TrainingGoal) => {
    setGoal(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Cual es tu objetivo principal?
        </h2>
        <p className="text-gray-400">
          Define que quieres lograr con tu entrenamiento
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GOAL_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.label}
            emoji={option.emoji}
            description={option.description}
            isSelected={goal === option.value}
            onClick={() => handleSelect(option.value)}
            color={option.color}
          />
        ))}
      </div>

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
