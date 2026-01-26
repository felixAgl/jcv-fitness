"use client";

import { cn } from "@/shared/utils/cn";
import type { Food } from "../data/foods";

interface FoodCardProps {
  food: Food;
  isSelected: boolean;
  onToggle: () => void;
}

export function FoodCard({ food, isSelected, onToggle }: FoodCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full p-4 rounded-xl border-2 transition-all duration-300 text-left",
        "hover:scale-[1.02] active:scale-[0.98]",
        isSelected
          ? "border-accent-green bg-accent-green/20 ring-2 ring-accent-green"
          : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{food.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={cn(
                "font-bold text-sm truncate",
                isSelected ? "text-accent-green" : "text-white"
              )}
            >
              {food.name}
            </h4>
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                isSelected
                  ? "border-accent-green bg-accent-green"
                  : "border-gray-600"
              )}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{food.altName}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">{food.techName}</p>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-accent-cyan font-medium">{food.calories} kcal</span>
            <span className="text-gray-500">|</span>
            <span className="text-accent-green">P: {food.protein}g</span>
            <span className="text-accent-orange">C: {food.carbs}g</span>
            <span className="text-accent-pink">G: {food.fat}g</span>
          </div>

          <p className="text-xs text-gray-500 mt-1.5">
            <span className="text-gray-400">Porcion:</span> {food.portion}
          </p>

          <p className="text-xs text-accent-cyan/80 mt-1 line-clamp-2">
            {food.benefits}
          </p>
        </div>
      </div>
    </button>
  );
}
