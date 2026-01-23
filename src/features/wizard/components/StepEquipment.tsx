"use client";

import { useWizardStore } from "../store/wizard-store";
import type { EquipmentType, EquipmentOption } from "../types";
import { NavigationButtons } from "./NavigationButtons";
import { cn } from "@/shared/utils/cn";

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: "sin_equipo", label: "Sin Equipo", emoji: "🏠", description: "Solo tu cuerpo" },
  { value: "mancuernas", label: "Mancuernas", emoji: "🏋️", description: "Pesas libres" },
  { value: "bandas", label: "Bandas", emoji: "🎗️", description: "Resistencia elastica" },
  { value: "barra", label: "Barra", emoji: "🔩", description: "Barra olimpica" },
  { value: "banco", label: "Banco", emoji: "🛋️", description: "Banco plano/inclinado" },
  { value: "pull_up_bar", label: "Barra Dominadas", emoji: "🪜", description: "Para colgarse" },
  { value: "kettlebell", label: "Kettlebell", emoji: "🔔", description: "Pesa rusa" },
  { value: "maquinas", label: "Maquinas", emoji: "🎰", description: "Maquinas de gimnasio" },
  { value: "trx", label: "TRX", emoji: "🪢", description: "Suspension training" },
  { value: "step", label: "Step/Cajon", emoji: "📦", description: "Plataforma" },
  { value: "pelota", label: "Balon Medicinal", emoji: "⚽", description: "Pelota con peso" },
  { value: "cuerda", label: "Cuerda", emoji: "🪢", description: "Saltar cuerda" },
];

export function StepEquipment() {
  const { equipment, toggleEquipment, nextStep, prevStep, canProceed } = useWizardStore();

  const handleToggle = (value: EquipmentType) => {
    toggleEquipment(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Con que equipo cuentas?
        </h2>
        <p className="text-gray-400">
          Selecciona todo el equipamiento que tienes disponible
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {EQUIPMENT_OPTIONS.map((option) => {
          const isSelected = equipment.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-300 text-center",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-accent-cyan bg-accent-cyan/20 ring-2 ring-accent-cyan"
                  : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
              )}
            >
              <span className="text-3xl block mb-2">{option.emoji}</span>
              <span className={cn(
                "text-sm font-semibold block",
                isSelected ? "text-white" : "text-gray-300"
              )}>
                {option.label}
              </span>
              <span className="text-xs text-gray-500 block mt-1">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        Puedes seleccionar multiples opciones
      </div>

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
