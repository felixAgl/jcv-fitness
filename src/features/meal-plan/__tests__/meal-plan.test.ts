import { describe, it, expect } from "vitest";
import { mealPlanPhase1 } from "../data/meal-plan-phase1";
import {
  proteinExchanges,
  carbExchanges,
  fatExchanges,
  vegetableExchanges,
} from "../data/food-exchanges";

describe("MealPlan Phase 1", () => {
  it("should have 7 days", () => {
    expect(mealPlanPhase1.days).toHaveLength(7);
  });

  it("should have 5 meals per day", () => {
    mealPlanPhase1.days.forEach((day) => {
      expect(day.meals).toHaveLength(5);
    });
  });

  it("should have valid meal times", () => {
    mealPlanPhase1.days.forEach((day) => {
      day.meals.forEach((meal) => {
        expect(meal.time).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
      });
    });
  });

  it("should have foods with positive grams", () => {
    mealPlanPhase1.days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          expect(food.grams).toBeGreaterThan(0);
        });
      });
    });
  });

  it("should have unique meal ids", () => {
    const ids = new Set<string>();
    mealPlanPhase1.days.forEach((day) => {
      day.meals.forEach((meal) => {
        expect(ids.has(meal.id)).toBe(false);
        ids.add(meal.id);
      });
    });
  });
});

describe("Food Exchanges", () => {
  it("should have protein exchanges", () => {
    expect(proteinExchanges.length).toBeGreaterThan(0);
    proteinExchanges.forEach((exchange) => {
      expect(exchange.category).toBe("protein");
      expect(exchange.equivalentGrams).toBeGreaterThan(0);
    });
  });

  it("should have carb exchanges", () => {
    expect(carbExchanges.length).toBeGreaterThan(0);
    carbExchanges.forEach((exchange) => {
      expect(exchange.category).toBe("carbs");
    });
  });

  it("should have fat exchanges", () => {
    expect(fatExchanges.length).toBeGreaterThan(0);
    fatExchanges.forEach((exchange) => {
      expect(exchange.category).toBe("fats");
    });
  });

  it("should have vegetable exchanges", () => {
    expect(vegetableExchanges.length).toBeGreaterThan(0);
    vegetableExchanges.forEach((exchange) => {
      expect(exchange.category).toBe("vegetables");
    });
  });
});
