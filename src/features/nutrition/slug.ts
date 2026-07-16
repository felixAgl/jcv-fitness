import { foods, type Food, type FoodCategory } from "@/features/wizard/data/foods";

/**
 * Slugify a food name for use in /nutricion/[alimento] URLs.
 * "Carne de Res" -> "carne-de-res"
 */
export function slugifyFoodName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface FoodWithSlug extends Food {
  slug: string;
}

export const foodsWithSlugs: FoodWithSlug[] = foods.map((food) => ({
  ...food,
  slug: slugifyFoodName(food.name),
}));

export function getFoodBySlug(slug: string): FoodWithSlug | undefined {
  return foodsWithSlugs.find((food) => food.slug === slug);
}

/** Same-category foods, excluding the given one. */
export function getSimilarFoods(food: FoodWithSlug, count = 4): FoodWithSlug[] {
  return foodsWithSlugs
    .filter((f) => f.category === food.category && f.id !== food.id)
    .slice(0, count);
}

export function getFoodsGroupedByCategory(): Record<FoodCategory, FoodWithSlug[]> {
  const grouped = {} as Record<FoodCategory, FoodWithSlug[]>;
  for (const food of foodsWithSlugs) {
    (grouped[food.category] ??= []).push(food);
  }
  return grouped;
}

/**
 * Extract portion grams from strings like "150g (1 pechuga mediana)",
 * "1 lata (160g)" or "1 vaso (250ml)". Treats ml as g (water-density foods).
 */
export function getPortionGrams(portion: string): number | null {
  const match = portion.match(/(\d+)\s*(g|ml)\b/i);
  return match ? Number(match[1]) : null;
}

/** Round to 1 decimal for per-portion macro values. */
export function perPortion(valuePer100g: number, grams: number): number {
  return Math.round(valuePer100g * (grams / 100) * 10) / 10;
}

/** Calorie split by macro (protein/carbs 4 kcal per g, fat 9 kcal per g). */
export function getMacroCalorieSplit(food: Food): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const proteinKcal = food.protein * 4;
  const carbsKcal = food.carbs * 4;
  const fatKcal = food.fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((proteinKcal / total) * 100),
    carbs: Math.round((carbsKcal / total) * 100),
    fat: Math.round((fatKcal / total) * 100),
  };
}
