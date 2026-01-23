"use client";

import { cn } from "@/shared/utils/cn";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = [
  "Nivel",
  "Objetivo",
  "Tiempo",
  "Equipo",
  "Duracion",
  "Tu Cuerpo",
  "Ejercicios",
  "Resumen",
];

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                    isCompleted && "bg-accent-cyan text-black",
                    isActive && "bg-accent-red text-white ring-2 ring-accent-red ring-offset-2 ring-offset-black",
                    !isActive && !isCompleted && "bg-gray-800 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 hidden sm:block transition-colors",
                    isActive
                      ? "text-accent-cyan font-semibold"
                      : isCompleted
                        ? "text-accent-cyan/70"
                        : "text-gray-400"
                  )}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded transition-colors duration-300",
                    isCompleted ? "bg-accent-cyan" : "bg-gray-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center mt-4">
        <span className="text-gray-300 text-sm">
          Paso <span className="text-accent-cyan font-bold">{currentStep}</span> de {totalSteps}
        </span>
      </div>
    </div>
  );
}
