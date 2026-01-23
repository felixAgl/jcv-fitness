"use client";

import { useState, useMemo } from "react";
import { useWizardStore } from "../store/wizard-store";
import { getFilteredExercises } from "../data/exercises";
import { TRANSLATIONS, type ExerciseCategory } from "../types";
import { ExerciseCard } from "./ExerciseCard";
import { NavigationButtons } from "./NavigationButtons";
import { cn } from "@/shared/utils/cn";

const CATEGORIES: ExerciseCategory[] = [
  "piernas",
  "pecho",
  "espalda",
  "brazos",
  "core",
  "cardio",
  "cuerpo_completo",
];

export function StepExercises() {
  const { equipment, selectedExercises, toggleExercise, nextStep, prevStep, canProceed } =
    useWizardStore();
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>("piernas");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExercises = useMemo(() => {
    let filtered = getFilteredExercises(activeCategory, equipment);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(term) ||
          ex.altName.toLowerCase().includes(term) ||
          ex.techName.toLowerCase().includes(term) ||
          ex.muscle.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [activeCategory, equipment, searchTerm]);

  const exerciseCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      const catExercises = getFilteredExercises(cat, equipment);
      counts[cat] = catExercises.filter((ex) => selectedExercises.includes(ex.id)).length;
    });
    return counts;
  }, [equipment, selectedExercises]);

  const selectAll = () => {
    const allIds = filteredExercises.map((ex) => ex.id);
    const currentSelected = new Set(selectedExercises);
    allIds.forEach((id) => currentSelected.add(id));
    useWizardStore.setState({ selectedExercises: Array.from(currentSelected) });
  };

  const deselectAll = () => {
    const categoryIds = new Set(filteredExercises.map((ex) => ex.id));
    const newSelected = selectedExercises.filter((id) => !categoryIds.has(id));
    useWizardStore.setState({ selectedExercises: newSelected });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Selecciona tus ejercicios
        </h2>
        <p className="text-gray-400">
          Elige los ejercicios que quieres incluir en tu rutina ({selectedExercises.length} seleccionados)
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 rounded-lg border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const count = exerciseCountByCategory[category] || 0;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all relative",
                activeCategory === category
                  ? "bg-accent-cyan text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              )}
            >
              {TRANSLATIONS.categories[category]}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-xs rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {filteredExercises.length} ejercicios disponibles
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3 py-1 text-sm rounded border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Deseleccionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredExercises.length > 0 ? (
          filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isSelected={selectedExercises.includes(exercise.id)}
              onToggle={() => toggleExercise(exercise.id)}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No se encontraron ejercicios para tu equipo disponible
          </div>
        )}
      </div>

      <NavigationButtons
        onBack={prevStep}
        onNext={nextStep}
        canProceed={canProceed()}
      />
    </div>
  );
}
