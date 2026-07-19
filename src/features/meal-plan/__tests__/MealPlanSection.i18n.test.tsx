import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MealPlanSection } from "../components/MealPlanSection";
import { mealPlanPhase1 } from "../data/meal-plan-phase1";

/**
 * Regression tests for the "EN mode shows Spanish meal data" bug: day names,
 * meal names, food names, units, notes and the phase/duration in the subtitle
 * come from the data file and must follow the active language.
 */

describe("MealPlanSection i18n", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders Spanish data by default (es)", async () => {
    render(<MealPlanSection config={mealPlanPhase1} isPreview />);

    expect(await screen.findByText("Lunes")).toBeInTheDocument();
    expect(screen.getByText("Desayuno")).toBeInTheDocument();
    expect(screen.getByText("Claras de huevo")).toBeInTheDocument();
    expect(screen.getByText(/Fase de Adaptación/)).toBeInTheDocument();
    expect(screen.getByText(/4 semanas/)).toBeInTheDocument();
    expect(screen.getByText("1 unidad")).toBeInTheDocument();
  });

  it("renders English data end-to-end when jcv-lang=en", async () => {
    window.localStorage.setItem("jcv-lang", "en");
    render(<MealPlanSection config={mealPlanPhase1} isPreview />);

    expect(await screen.findByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Egg whites")).toBeInTheDocument();
    expect(screen.getByText(/Adaptation Phase/)).toBeInTheDocument();
    expect(screen.getByText(/4 weeks/)).toBeInTheDocument();
    expect(screen.getByText("1 unit")).toBeInTheDocument();

    // No Spanish leaks from the data layer
    expect(screen.queryByText(/Lunes/)).not.toBeInTheDocument();
    expect(screen.queryByText("Desayuno")).not.toBeInTheDocument();
    expect(screen.queryByText("Claras de huevo")).not.toBeInTheDocument();
    expect(screen.queryByText(/Fase de Adaptación/)).not.toBeInTheDocument();
    expect(screen.queryByText(/semanas/)).not.toBeInTheDocument();
  });
});

describe("meal plan data bilingual completeness", () => {
  const SPANISH_MARKERS = ["ejercicio", "semana", "descanso", "unidad"];

  it("every text field has es+en and en is free of Spanish markers", () => {
    const check = (field: { es: string; en: string }, path: string) => {
      expect(field.es?.trim(), `${path}.es empty`).toBeTruthy();
      expect(field.en?.trim(), `${path}.en empty`).toBeTruthy();
      const lower = field.en.toLowerCase();
      const hit = SPANISH_MARKERS.find((m) => lower.includes(m));
      expect(hit, `${path}.en "${field.en}" contains Spanish marker "${hit}"`).toBeUndefined();
    };

    check(mealPlanPhase1.phaseName, "phaseName");
    check(mealPlanPhase1.duration, "duration");
    mealPlanPhase1.days.forEach((day) => {
      check(day.dayName, `day ${day.day} dayName`);
      day.meals.forEach((meal) => {
        check(meal.name, `${meal.id}.name`);
        if (meal.notes) check(meal.notes, `${meal.id}.notes`);
        meal.foods.forEach((food, i) => {
          check(food.name, `${meal.id}.foods[${i}].name`);
          if (food.unit) check(food.unit, `${meal.id}.foods[${i}].unit`);
        });
      });
    });
  });
});
