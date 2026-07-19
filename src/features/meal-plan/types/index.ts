import type { BilingualText } from "@/features/exercises";

export type { BilingualText };

export interface FoodItem {
  name: BilingualText;
  grams: number;
  /** Optional display unit, e.g. "1 unidad" / "1 unit". */
  unit?: BilingualText;
}

export interface Meal {
  id: string;
  name: BilingualText;
  time: string;
  foods: FoodItem[];
  notes?: BilingualText;
}

export interface DayPlan {
  day: number;
  dayName: BilingualText;
  meals: Meal[];
}

export interface FoodExchange {
  category: "protein" | "carbs" | "fats" | "vegetables";
  name: string;
  equivalentGrams: number;
  baseFood: string;
}

export interface MealPlanConfig {
  phase: number;
  phaseName: BilingualText;
  duration: BilingualText;
  dailyMeals: number;
  days: DayPlan[];
  exchanges: FoodExchange[];
}
