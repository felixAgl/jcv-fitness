"use client";

import { useWizardStore } from "../store/wizard-store";
import { NavigationButtons } from "./NavigationButtons";
import { ACTIVITY_LEVELS, WEIGHT_GOALS } from "../types";
import { cn } from "@/shared/utils/cn";

export function StepBodyData() {
  const { userBodyData, updateBodyDataField, nextStep, prevStep, canProceed, calculateCalories } =
    useWizardStore();

  const calories = calculateCalories();

  const currentData = userBodyData || {
    currentWeight: 70,
    targetWeight: 70,
    height: 170,
    age: 25,
    gender: "masculino" as const,
    activityLevel: "moderado" as const,
    weightGoal: "mantener" as const,
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Cuentanos sobre ti
        </h2>
        <p className="text-gray-400">
          Estos datos nos ayudan a personalizar tu plan de alimentacion
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Nota: Esto es orientativo. No somos nutricionistas, pero te damos una guia basica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Genero
            </label>
            <div className="flex gap-3">
              {[
                { value: "masculino", label: "Masculino", emoji: "👨" },
                { value: "femenino", label: "Femenino", emoji: "👩" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateBodyDataField("gender", option.value as "masculino" | "femenino")}
                  className={cn(
                    "flex-1 p-3 rounded-lg border-2 transition-all",
                    currentData.gender === option.value
                      ? "border-accent-cyan bg-accent-cyan/20"
                      : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                  )}
                >
                  <span className="text-2xl block mb-1">{option.emoji}</span>
                  <span className="text-sm text-white">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Edad
            </label>
            <input
              type="number"
              min={15}
              max={80}
              value={currentData.age}
              onChange={(e) => updateBodyDataField("age", Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:border-accent-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Altura (cm)
            </label>
            <input
              type="number"
              min={120}
              max={230}
              value={currentData.height}
              onChange={(e) => updateBodyDataField("height", Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:border-accent-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peso actual (kg)
            </label>
            <input
              type="number"
              min={30}
              max={200}
              step={0.5}
              value={currentData.currentWeight}
              onChange={(e) => updateBodyDataField("currentWeight", Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:border-accent-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peso objetivo (kg)
            </label>
            <input
              type="number"
              min={30}
              max={200}
              step={0.5}
              value={currentData.targetWeight}
              onChange={(e) => updateBodyDataField("targetWeight", Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:border-accent-cyan focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Objetivo de peso
            </label>
            <div className="grid gap-2">
              {WEIGHT_GOALS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateBodyDataField("weightGoal", option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3",
                    currentData.weightGoal === option.value
                      ? "border-accent-cyan bg-accent-cyan/20"
                      : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-white font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nivel de actividad
            </label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateBodyDataField("activityLevel", option.value)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 transition-all text-left",
                    currentData.activityLevel === option.value
                      ? "border-accent-cyan bg-accent-cyan/20"
                      : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                  )}
                >
                  <span className="text-white font-medium">{option.label}</span>
                  <span className="text-xs text-gray-400 block">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {calories && (
        <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-blue/10 rounded-xl p-6 border border-accent-cyan/30">
          <h3 className="text-lg font-bold text-white mb-4 text-center">
            Tu estimacion de calorias diarias
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-400">{calories.bmr}</div>
              <div className="text-xs text-gray-500">Metabolismo Basal</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{calories.tdee}</div>
              <div className="text-xs text-gray-400">Mantenimiento</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-cyan">{calories.target}</div>
              <div className="text-xs text-accent-cyan">Calorias Objetivo</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Estimacion basada en la formula Harris-Benedict. Consulta un nutricionista para un plan personalizado.
          </p>
        </div>
      )}

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
