"use client";

import { useState, useMemo } from "react";
import { useWizardStore } from "../store/wizard-store";
import {
  foods,
  getFoodsByCategory,
  RECOMMENDED_BY_CATEGORY,
  FOOD_TRANSLATIONS,
  type FoodCategory,
} from "../data/foods";
import { FoodCard } from "./FoodCard";
import { NavigationButtons } from "./NavigationButtons";
import { cn } from "@/shared/utils/cn";

const CATEGORIES: FoodCategory[] = [
  "proteinas",
  "carbohidratos",
  "grasas",
  "vegetales",
  "frutas",
  "lacteos",
];

export function StepFoods() {
  const { selectedFoods, toggleFood, setSelectedFoods, nextStep, prevStep, canProceed } =
    useWizardStore();
  const [activeCategory, setActiveCategory] = useState<FoodCategory>("proteinas");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasAppliedRecommendations, setHasAppliedRecommendations] = useState(false);

  const filteredFoods = useMemo(() => {
    let filtered = getFoodsByCategory(activeCategory);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(term) ||
          food.altName.toLowerCase().includes(term) ||
          food.techName.toLowerCase().includes(term) ||
          food.benefits.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [activeCategory, searchTerm]);

  const foodCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      const catFoods = getFoodsByCategory(cat);
      counts[cat] = catFoods.filter((food) => selectedFoods.includes(food.id)).length;
    });
    return counts;
  }, [selectedFoods]);

  const recommendedForCategory = useMemo(() => {
    const recommended = RECOMMENDED_BY_CATEGORY[activeCategory] || [];
    return filteredFoods.filter((food) => recommended.includes(food.id));
  }, [activeCategory, filteredFoods]);

  const otherFoods = useMemo(() => {
    const recommended = RECOMMENDED_BY_CATEGORY[activeCategory] || [];
    return filteredFoods.filter((food) => !recommended.includes(food.id));
  }, [activeCategory, filteredFoods]);

  const selectAll = () => {
    const allIds = filteredFoods.map((food) => food.id);
    const currentSelected = new Set(selectedFoods);
    allIds.forEach((id) => currentSelected.add(id));
    setSelectedFoods(Array.from(currentSelected));
  };

  const deselectAll = () => {
    const categoryIds = new Set(filteredFoods.map((food) => food.id));
    const newSelected = selectedFoods.filter((id) => !categoryIds.has(id));
    setSelectedFoods(newSelected);
  };

  const selectRecommended = () => {
    const allRecommended: string[] = [];
    CATEGORIES.forEach((cat) => {
      const recommended = RECOMMENDED_BY_CATEGORY[cat] || [];
      const catFoods = getFoodsByCategory(cat);
      catFoods
        .filter((food) => recommended.includes(food.id))
        .forEach((food) => allRecommended.push(food.id));
    });
    const currentSelected = new Set(selectedFoods);
    allRecommended.forEach((id) => currentSelected.add(id));
    setSelectedFoods(Array.from(currentSelected));
    setHasAppliedRecommendations(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Selecciona tus alimentos
        </h2>
        <p className="text-gray-400">
          Elige los alimentos que prefieres para tu plan nutricional ({selectedFoods.length}{" "}
          seleccionados)
        </p>
      </div>

      {!hasAppliedRecommendations && selectedFoods.length === 0 && (
        <div className="bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 rounded-xl p-4 border border-accent-green/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-white font-medium">No sabes cuales elegir?</p>
              <p className="text-sm text-gray-400">
                Usa nuestra seleccion balanceada recomendada por JCV
              </p>
            </div>
            <button
              type="button"
              onClick={selectRecommended}
              className="px-4 py-2 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/90 transition-colors whitespace-nowrap"
            >
              Usar recomendados
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar alimento por nombre o beneficio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 rounded-lg border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:border-accent-green focus:outline-none"
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
          const count = foodCountByCategory[category] || 0;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all relative",
                activeCategory === category
                  ? "bg-accent-green text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              )}
            >
              {FOOD_TRANSLATIONS[category]}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-cyan text-black text-xs rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {filteredFoods.length} alimentos disponibles
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

      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {recommendedForCategory.length > 0 && !searchTerm && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent-green text-sm font-bold">Recomendados por JCV</span>
              <span className="text-xs text-gray-500">- Alimentos base para tu dieta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedForCategory.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  isSelected={selectedFoods.includes(food.id)}
                  onToggle={() => toggleFood(food.id)}
                />
              ))}
            </div>
          </div>
        )}

        {otherFoods.length > 0 && (
          <div>
            {recommendedForCategory.length > 0 && !searchTerm && (
              <div className="flex items-center gap-2 mb-3 pt-4 border-t border-gray-800">
                <span className="text-gray-400 text-sm font-medium">Otras opciones</span>
                <span className="text-xs text-gray-500">- Para variar tu alimentacion</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(searchTerm ? filteredFoods : otherFoods).map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  isSelected={selectedFoods.includes(food.id)}
                  onToggle={() => toggleFood(food.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredFoods.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron alimentos con ese nombre
          </div>
        )}
      </div>

      <NavigationButtons onBack={prevStep} onNext={nextStep} canProceed={canProceed()} />
    </div>
  );
}
