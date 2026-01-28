"use client";

import { useWizardStore } from "../store/wizard-store";
import type { TrainingLevel, LevelOption } from "../types";
import { OptionCard } from "./OptionCard";
import { NavigationButtons } from "./NavigationButtons";

const LEVEL_OPTIONS: LevelOption[] = [
  {
    value: "principiante",
    label: "Principiante",
    subtitle: "Nuevo en el fitness",
    description: "Menos de 3 meses entrenando o retomando después de mucho tiempo",
    color: "green",
  },
  {
    value: "basico",
    label: "Básico",
    subtitle: "Conocimientos fundamentales",
    description: "3-6 meses de experiencia, conoces ejercicios básicos",
    color: "blue",
  },
  {
    value: "intermedio",
    label: "Intermedio",
    subtitle: "Entrenamiento consistente",
    description: "6-18 meses entrenando regularmente, buena técnica",
    color: "yellow",
  },
  {
    value: "avanzado",
    label: "Avanzado",
    subtitle: "Alto rendimiento",
    description: "Más de 2 años, entrenas 4+ días/semana, técnica avanzada",
    color: "orange",
  },
  {
    value: "elite",
    label: "Elite",
    subtitle: "Nivel competitivo",
    description: "Atleta o competidor, +4 años de experiencia seria",
    color: "red",
  },
];

export function StepLevel() {
  const { level, setLevel, nextStep, canProceed } = useWizardStore();

  const handleSelect = (value: TrainingLevel) => {
    setLevel(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          ¿Cuál es tu nivel de entrenamiento?
        </h2>
        <p className="text-gray-400">
          Selecciona el nivel que mejor describe tu experiencia actual
        </p>
      </div>

      <div className="grid gap-4">
        {LEVEL_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.label}
            subtitle={option.subtitle}
            description={option.description}
            isSelected={level === option.value}
            onClick={() => handleSelect(option.value)}
            color={option.color}
          />
        ))}
      </div>

      <NavigationButtons
        onNext={nextStep}
        canProceed={canProceed()}
        isFirstStep
      />
    </div>
  );
}
