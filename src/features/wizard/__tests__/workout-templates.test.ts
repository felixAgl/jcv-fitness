import { describe, it, expect } from "vitest";
import {
  generateWorkoutPlan,
  getVideoUrl,
  EXERCISE_VIDEOS,
} from "../data/workout-templates";

describe("Workout Plan Generator", () => {
  describe("generateWorkoutPlan", () => {
    it("should generate 7 days of workouts", () => {
      const plan = generateWorkoutPlan("intermedio", "ganar_musculo", [], 45);
      expect(plan).toHaveLength(7);
    });

    it("should include rest days", () => {
      const plan = generateWorkoutPlan("principiante", "perder_grasa", [], 30);
      const restDays = plan.filter((d) => d.restDay);
      expect(restDays.length).toBeGreaterThan(0);
    });

    it("should have exercises on non-rest days", () => {
      const plan = generateWorkoutPlan("intermedio", "tonificar", [], 45);
      const workDays = plan.filter((d) => !d.restDay);

      workDays.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThan(0);
      });
    });

    it("should adjust sets based on level", () => {
      const beginnerPlan = generateWorkoutPlan("principiante", "salud", [], 30);
      const advancedPlan = generateWorkoutPlan("avanzado", "salud", [], 30);

      const beginnerSets = beginnerPlan
        .flatMap((d) => d.exercises)
        .reduce((sum, e) => sum + e.sets, 0);
      const advancedSets = advancedPlan
        .flatMap((d) => d.exercises)
        .reduce((sum, e) => sum + e.sets, 0);

      expect(advancedSets).toBeGreaterThanOrEqual(beginnerSets);
    });

    it("should include rest times in exercises", () => {
      const plan = generateWorkoutPlan("basico", "fuerza", [], 45);
      const workDay = plan.find((d) => !d.restDay);

      if (workDay) {
        workDay.exercises.forEach((ex) => {
          expect(ex.rest).toMatch(/\d+s/);
        });
      }
    });

    it("should include exercise IDs", () => {
      const plan = generateWorkoutPlan("intermedio", "ganar_musculo", [], 60);
      const workDay = plan.find((d) => !d.restDay);

      if (workDay) {
        workDay.exercises.forEach((ex) => {
          expect(ex.exerciseId).toBeDefined();
          expect(ex.exerciseId.length).toBeGreaterThan(0);
        });
      }
    });

    it("should vary workouts for PPL split at higher levels", () => {
      const plan = generateWorkoutPlan("elite", "ganar_musculo", [], 90);
      const workDays = plan.filter((d) => !d.restDay);
      const uniqueNames = new Set(workDays.map((d) => d.name));

      expect(uniqueNames.size).toBeGreaterThan(1);
    });
  });

  describe("EXERCISE_VIDEOS", () => {
    it("should have video URLs for compound exercises", () => {
      expect(EXERCISE_VIDEOS.sentadilla).toBeDefined();
      expect(EXERCISE_VIDEOS.peso_muerto).toBeDefined();
      expect(EXERCISE_VIDEOS.press_banca).toBeDefined();
      expect(EXERCISE_VIDEOS.dominadas).toBeDefined();
    });

    it("should have valid YouTube URLs", () => {
      Object.values(EXERCISE_VIDEOS).forEach((url) => {
        expect(url).toMatch(/^https:\/\/youtu\.be\//);
      });
    });
  });

  describe("getVideoUrl", () => {
    it("should return video URL for known exercises", () => {
      const url = getVideoUrl("sentadilla");
      expect(url).toBeDefined();
      expect(url).toContain("youtu.be");
    });

    it("should return undefined for unknown exercises", () => {
      const url = getVideoUrl("ejercicio_inventado_123");
      expect(url).toBeUndefined();
    });
  });
});
