import { describe, it, expect } from "vitest";
import { generateMealPlan, FOODS } from "../data/meal-templates";

describe("Meal Plan Generator", () => {
  describe("generateMealPlan", () => {
    it("should generate 7 days of meals by default", () => {
      const plan = generateMealPlan(2000, "mantener");
      expect(plan).toHaveLength(7);
    });

    it("should generate specified number of days", () => {
      const plan = generateMealPlan(2000, "mantener", 5);
      expect(plan).toHaveLength(5);
    });

    it("should include all 5 meals per day", () => {
      const plan = generateMealPlan(2000, "mantener", 1);
      expect(plan[0].meals).toHaveLength(5);

      const mealNames = plan[0].meals.map((m) => m.name);
      expect(mealNames).toContain("Desayuno");
      expect(mealNames).toContain("Snack AM");
      expect(mealNames).toContain("Almuerzo");
      expect(mealNames).toContain("Snack PM");
      expect(mealNames).toContain("Cena");
    });

    it("should have positive calories for each day", () => {
      const plan = generateMealPlan(2500, "ganar");
      plan.forEach((day) => {
        expect(day.totalCalories).toBeGreaterThan(0);
      });
    });

    it("should have macros for each day", () => {
      const plan = generateMealPlan(2000, "perder");
      plan.forEach((day) => {
        expect(day.macros.protein).toBeGreaterThan(0);
        expect(day.macros.carbs).toBeGreaterThan(0);
        expect(day.macros.fat).toBeGreaterThan(0);
      });
    });

    it("should vary meals across different days", () => {
      const plan = generateMealPlan(2000, "mantener", 7);
      const day1Foods = plan[0].meals[2].foods.map((f) => f.name).join(",");
      const day4Foods = plan[3].meals[2].foods.map((f) => f.name).join(",");
      expect(day1Foods).not.toBe(day4Foods);
    });
  });

  describe("FOODS database", () => {
    it("should have all required nutritional info", () => {
      Object.values(FOODS).forEach((food) => {
        expect(food.name).toBeDefined();
        expect(food.portion).toBeDefined();
        expect(typeof food.calories).toBe("number");
        expect(typeof food.protein).toBe("number");
        expect(typeof food.carbs).toBe("number");
        expect(typeof food.fat).toBe("number");
      });
    });

    it("should have realistic calorie values", () => {
      Object.values(FOODS).forEach((food) => {
        expect(food.calories).toBeGreaterThan(0);
        expect(food.calories).toBeLessThan(500);
      });
    });

    it("should include Colombian staples", () => {
      expect(FOODS.arepa).toBeDefined();
      expect(FOODS.platano).toBeDefined();
      expect(FOODS.yuca).toBeDefined();
      expect(FOODS.queso_campesino).toBeDefined();
    });

    it("should include protein sources", () => {
      expect(FOODS.pollo_pechuga).toBeDefined();
      expect(FOODS.carne_res_magra).toBeDefined();
      expect(FOODS.pescado_tilapia).toBeDefined();
      expect(FOODS.huevos_enteros).toBeDefined();
    });
  });
});
