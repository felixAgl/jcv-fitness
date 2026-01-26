"use client";

import { useWizardStore } from "../store/wizard-store";
import type { EquipmentType, EquipmentOption } from "../types";
import { NavigationButtons } from "./NavigationButtons";
import { cn } from "@/shared/utils/cn";

const GYM_EQUIPMENT: EquipmentType[] = [
  "mancuernas", "barra", "banco", "maquinas", "pull_up_bar",
  "kettlebell", "poleas", "discos", "step"
];

const QUICK_OPTIONS: Array<{ label: string; emoji: string; description: string; equipment: EquipmentType[] }> = [
  {
    label: "Gimnasio Completo",
    emoji: "🏋️‍♂️",
    description: "Acceso a todo el gym",
    equipment: GYM_EQUIPMENT,
  },
  {
    label: "Casa Basico",
    emoji: "🏠",
    description: "Sin equipo, solo tu cuerpo",
    equipment: ["sin_equipo"],
  },
  {
    label: "Casa Equipado",
    emoji: "🏡",
    description: "Mancuernas y bandas",
    equipment: ["sin_equipo", "mancuernas", "bandas"],
  },
];

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: "sin_equipo", label: "Sin Equipo", emoji: "🏠", description: "Solo tu cuerpo y el piso" },
  { value: "mancuernas", label: "Mancuernas", emoji: "🏋️", description: "Pesas libres de cualquier peso" },
  { value: "bandas", label: "Bandas Elasticas", emoji: "🎗️", description: "Resistencia progresiva" },
  { value: "ligas", label: "Ligas/Therabands", emoji: "🔗", description: "Rehabilitacion y fuerza" },
  { value: "barra", label: "Barra Olimpica", emoji: "🔩", description: "Barra recta 20kg" },
  { value: "banco", label: "Banco", emoji: "🛋️", description: "Plano, inclinado o declinado" },
  { value: "pull_up_bar", label: "Barra Dominadas", emoji: "🪜", description: "Fija en puerta o pared" },
  { value: "kettlebell", label: "Kettlebell", emoji: "🔔", description: "Pesa rusa para swings" },
  { value: "maquinas", label: "Maquinas Gym", emoji: "🎰", description: "Poleas, prensa, etc." },
  { value: "poleas", label: "Poleas/Cables", emoji: "⚙️", description: "Sistema de cables" },
  { value: "discos", label: "Discos/Bumpers", emoji: "🔘", description: "Pesas para barra" },
  { value: "trx", label: "TRX/Suspension", emoji: "🪢", description: "Entrenamiento en suspension" },
  { value: "step", label: "Step/Cajon", emoji: "📦", description: "Plataforma para saltos" },
  { value: "pelota", label: "Balon Medicinal", emoji: "⚽", description: "Pelota con peso 3-10kg" },
  { value: "cuerda", label: "Cuerda de Saltar", emoji: "🪢", description: "Cardio y coordinacion" },
  { value: "soga_batalla", label: "Soga de Batalla", emoji: "🌊", description: "Battle ropes HIIT" },
];

export function StepEquipment() {
  const { equipment, toggleEquipment, nextStep, prevStep, canProceed } = useWizardStore();

  const handleToggle = (value: EquipmentType) => {
    toggleEquipment(value);
  };

  const handleQuickSelect = (equipmentList: EquipmentType[]) => {
    const currentEquipment = new Set(equipment);
    const isAllSelected = equipmentList.every(eq => currentEquipment.has(eq));

    if (isAllSelected) {
      equipmentList.forEach(eq => {
        if (equipment.includes(eq)) {
          toggleEquipment(eq);
        }
      });
    } else {
      equipmentList.forEach(eq => {
        if (!equipment.includes(eq)) {
          toggleEquipment(eq);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Con que equipo cuentas?
        </h2>
        <p className="text-gray-400">
          Selecciona tu situacion o elige equipo especifico
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {QUICK_OPTIONS.map((option) => {
          const isAllSelected = option.equipment.every(eq => equipment.includes(eq));
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handleQuickSelect(option.equipment)}
              className={cn(
                "p-5 rounded-xl border-2 transition-all duration-300 text-center",
                "hover:scale-[1.02] active:scale-[0.98]",
                isAllSelected
                  ? "border-accent-green bg-accent-green/20 ring-2 ring-accent-green"
                  : "border-gray-600 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-accent-cyan/50"
              )}
            >
              <span className="text-4xl block mb-2">{option.emoji}</span>
              <span className={cn(
                "text-base font-bold block",
                isAllSelected ? "text-accent-green" : "text-white"
              )}>
                {option.label}
              </span>
              <span className="text-xs text-gray-400 block mt-1">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-800 pt-6">
        <p className="text-sm text-gray-400 mb-4 text-center">
          O selecciona equipo especifico:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {EQUIPMENT_OPTIONS.map((option) => {
            const isSelected = equipment.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-300 text-center",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "border-accent-cyan bg-accent-cyan/20 ring-2 ring-accent-cyan"
                    : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                )}
              >
                <span className="text-2xl block mb-1">{option.emoji}</span>
                <span className={cn(
                  "text-xs font-semibold block",
                  isSelected ? "text-white" : "text-gray-300"
                )}>
                  {option.label}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5 leading-tight">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        {equipment.length} equipo(s) seleccionado(s)
      </div>

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
