import { describe, it, expect } from "vitest";
import { gymWorkoutPlan, homeWorkoutPlan } from "../data";

describe("Gym Workout Plan", () => {
  it("should have 6 days", () => {
    expect(gymWorkoutPlan.days).toHaveLength(6);
  });

  it("should be gym type", () => {
    expect(gymWorkoutPlan.type).toBe("gym");
  });

  it("should have exercises with valid sets and reps", () => {
    gymWorkoutPlan.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        expect(exercise.sets).toBeGreaterThan(0);
        expect(exercise.reps).toBeTruthy();
        expect(exercise.rest).toBeTruthy();
      });
    });
  });

  it("should have unique exercise ids", () => {
    const ids = new Set<string>();
    gymWorkoutPlan.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        expect(ids.has(exercise.id)).toBe(false);
        ids.add(exercise.id);
      });
    });
  });

  it("should have muscle group for each day", () => {
    gymWorkoutPlan.days.forEach((day) => {
      expect(day.muscleGroup).toBeTruthy();
    });
  });
});

describe("Home Workout Plan", () => {
  it("should have 4 days", () => {
    expect(homeWorkoutPlan.days).toHaveLength(4);
  });

  it("should be home type", () => {
    expect(homeWorkoutPlan.type).toBe("home");
  });

  it("should have exercises with valid sets and reps", () => {
    homeWorkoutPlan.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        expect(exercise.sets).toBeGreaterThan(0);
        expect(exercise.reps).toBeTruthy();
      });
    });
  });

  it("should have unique exercise ids", () => {
    const ids = new Set<string>();
    homeWorkoutPlan.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        expect(ids.has(exercise.id)).toBe(false);
        ids.add(exercise.id);
      });
    });
  });
});
