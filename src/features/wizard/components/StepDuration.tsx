"use client";

import { useWizardStore } from "../store/wizard-store";
import type { ProgramDuration, DurationOption } from "../types";
import { OptionCard } from "./OptionCard";
import { NavigationButtons } from "./NavigationButtons";

const DURATION_OPTIONS: DurationOption[] = [
  { value: "1_dia", label: "1 Día", description: "Rutina de prueba rápida" },
  { value: "3_dias", label: "3 Días", description: "Inicio suave" },
  { value: "1_semana", label: "1 Semana", description: "Primera semana de adaptación" },
  { value: "2_semanas", label: "2 Semanas", description: "Programa corto" },
  { value: "1_mes", label: "1 Mes", description: "Ciclo estándar recomendado" },
  { value: "6_semanas", label: "6 Semanas", description: "Transformación inicial" },
  { value: "2_meses", label: "2 Meses", description: "Resultados visibles" },
  { value: "3_meses", label: "3 Meses", description: "Transformación completa" },
];

export function StepDuration() {
  const { duration, setDuration, nextStep, prevStep, canProceed } = useWizardStore();

  const handleSelect = (value: ProgramDuration) => {
    setDuration(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          ¿Cuánto tiempo quieres entrenar?
        </h2>
        <p className="text-gray-400">
          Selecciona la duración de tu programa de entrenamiento
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DURATION_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.label}
            description={option.description}
            isSelected={duration === option.value}
            onClick={() => handleSelect(option.value)}
            color="cyan"
            size="sm"
          />
        ))}
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <p className="text-sm text-gray-400 text-center">
          <span className="text-accent-cyan font-semibold">Recomendación:</span> Para ver resultados reales,
          te sugerimos un programa de al menos 1 mes. Los cambios físicos requieren tiempo y consistencia.
        </p>
      </div>

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
