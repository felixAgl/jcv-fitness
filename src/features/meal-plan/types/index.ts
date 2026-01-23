export interface FoodItem {
  name: string;
  grams: number;
  unit?: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: FoodItem[];
  notes?: string;
}

export interface DayPlan {
  day: number;
  dayName: string;
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
  phaseName: string;
  duration: string;
  dailyMeals: number;
  days: DayPlan[];
  exchanges: FoodExchange[];
}
