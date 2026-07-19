import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutPlanSection } from "../components/WorkoutPlanSection";
import { gymWorkoutPlan, homeWorkoutPlan } from "../data";

/**
 * Regression tests for the "EN mode shows Spanish workout data" production
 * bug: the section heading was translated but everything rendered from the
 * data files (day names, muscle groups, exercise names, notes, sets/reps/rest
 * labels) stayed in Spanish.
 */

function renderSection() {
  render(
    <WorkoutPlanSection gymPlan={gymWorkoutPlan} homePlan={homeWorkoutPlan} isPreview />
  );
}

describe("WorkoutPlanSection i18n", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders Spanish data by default (es)", async () => {
    renderSection();

    expect(await screen.findByText("Lunes")).toBeInTheDocument();
    expect(screen.getByText("Pecho y Triceps")).toBeInTheDocument();
    expect(screen.getByText("Press de banca plano")).toBeInTheDocument();
    expect(screen.getByText("Controla el peso en la bajada")).toBeInTheDocument();
    expect(screen.getAllByText("4 series").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10-12 reps").length).toBeGreaterThan(0);
    // Rest chip + intensity label
    expect(screen.getAllByText("90 seg").length).toBeGreaterThan(0);
    expect(screen.getByText(/Intensidad: Moderada/)).toBeInTheDocument();
  });

  it("renders English data end-to-end when jcv-lang=en", async () => {
    window.localStorage.setItem("jcv-lang", "en");
    renderSection();

    // Data-driven content switches to English
    expect(await screen.findByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Chest & Triceps")).toBeInTheDocument();
    expect(screen.getByText("Flat Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Control the weight on the way down")).toBeInTheDocument();
    expect(screen.getAllByText("4 sets").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10-12 reps").length).toBeGreaterThan(0);
    expect(screen.getAllByText("90 sec").length).toBeGreaterThan(0);
    expect(screen.getByText(/Intensity: Moderate/)).toBeInTheDocument();

    // No Spanish leaks from the data layer
    expect(screen.queryByText(/Lunes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pecho y Triceps/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Press de banca plano/)).not.toBeInTheDocument();
    expect(screen.queryByText(/seg\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Intensidad/)).not.toBeInTheDocument();
  });
});

describe("workout data bilingual completeness", () => {
  const SPANISH_MARKERS = [
    "ejercicio",
    "semana",
    "descanso",
    " seg",
    "c/lado",
    "c/pierna",
    "c/brazo",
  ];

  it.each([
    ["gym", gymWorkoutPlan],
    ["home", homeWorkoutPlan],
  ] as const)("%s plan has es+en for every text field, en free of Spanish markers", (_label, plan) => {
    const check = (field: { es: string; en: string }, path: string) => {
      expect(field.es?.trim(), `${path}.es empty`).toBeTruthy();
      expect(field.en?.trim(), `${path}.en empty`).toBeTruthy();
      const lower = field.en.toLowerCase();
      const hit = SPANISH_MARKERS.find((m) => lower.includes(m));
      expect(hit, `${path}.en "${field.en}" contains Spanish marker "${hit}"`).toBeUndefined();
    };

    check(plan.name, `${plan.id}.name`);
    plan.days.forEach((day) => {
      check(day.dayName, `${plan.id} day ${day.day} dayName`);
      check(day.muscleGroup, `${plan.id} day ${day.day} muscleGroup`);
      day.exercises.forEach((ex) => {
        check(ex.name, `${ex.id}.name`);
        check(ex.reps, `${ex.id}.reps`);
        check(ex.rest, `${ex.id}.rest`);
        if (ex.notes) check(ex.notes, `${ex.id}.notes`);
      });
      if (day.cardio) {
        check(day.cardio.type, `${plan.id} day ${day.day} cardio.type`);
        check(day.cardio.intensity, `${plan.id} day ${day.day} cardio.intensity`);
        if (day.cardio.notes) check(day.cardio.notes, `${plan.id} day ${day.day} cardio.notes`);
      }
    });
  });
});
