"use client";

import { useWizardStore } from "../store/wizard-store";
import { NavigationButtons } from "./NavigationButtons";
import { cn } from "@/shared/utils/cn";

const TIME_OPTIONS = [15, 20, 30, 45, 60, 90];

export function StepTime() {
  const { time, setTime, nextStep, prevStep, canProceed } = useWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Cuanto tiempo puedes entrenar?
        </h2>
        <p className="text-gray-400">
          Selecciona la duracion de cada sesion de entrenamiento
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {TIME_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => setTime(minutes)}
            className={cn(
              "p-6 rounded-xl border-2 transition-all duration-300",
              "hover:scale-[1.02] active:scale-[0.98]",
              time === minutes
                ? "border-accent-cyan bg-accent-cyan/20 ring-2 ring-accent-cyan"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            )}
          >
            <div className="text-4xl font-bold text-white mb-1">{minutes}</div>
            <div className="text-sm text-gray-400">minutos</div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <label className="block text-center mb-4">
          <span className="text-gray-300">O selecciona un valor personalizado:</span>
        </label>
        <div className="flex items-center justify-center gap-4">
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
            className="w-full max-w-md h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
          />
          <div className="w-20 text-center">
            <span className="text-2xl font-bold text-accent-cyan">{time}</span>
            <span className="text-sm text-gray-400 ml-1">min</span>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        Recomendamos minimo 20 minutos para resultados efectivos
      </div>

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
