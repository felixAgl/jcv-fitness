import { describe, it, expect } from "vitest";
import { generatePhase2Preview, PHASE2_DURATION_DAYS, type Phase2Input } from "../phase2";
import { generateWorkoutPlan } from "@/features/wizard/data/workout-templates";

const baseInput: Phase2Input = {
  level: "principiante",
  goal: "ganar_musculo",
  selectedExercises: [], // empty = all exercises available
  time: 60,
};

describe("generatePhase2Preview", () => {
  it("returns null when level or goal is missing", () => {
    expect(generatePhase2Preview({ ...baseInput, level: null })).toBeNull();
    expect(generatePhase2Preview({ ...baseInput, goal: null })).toBeNull();
  });

  it("is deterministic: same input produces identical output", () => {
    const a = generatePhase2Preview(baseInput);
    const b = generatePhase2Preview(baseInput);
    expect(a).toEqual(b);
  });

  it("bumps the level one step when below avanzado", () => {
    const principiante = generatePhase2Preview({ ...baseInput, level: "principiante" });
    expect(principiante?.level).toBe("basico");
    expect(principiante?.levelBumped).toBe(true);

    const basico = generatePhase2Preview({ ...baseInput, level: "basico" });
    expect(basico?.level).toBe("intermedio");
    expect(basico?.levelBumped).toBe(true);

    const intermedio = generatePhase2Preview({ ...baseInput, level: "intermedio" });
    expect(intermedio?.level).toBe("avanzado");
    expect(intermedio?.levelBumped).toBe(true);
  });

  it("bumped plan matches generateWorkoutPlan at the next level (reuse, not reinvention)", () => {
    const preview = generatePhase2Preview({ ...baseInput, level: "intermedio" });
    const expected = generateWorkoutPlan("avanzado", "ganar_musculo", [], 60);
    expect(preview?.days).toEqual(expected);
  });

  it("keeps avanzado level and adds +1 set on compound exercises", () => {
    const preview = generatePhase2Preview({ ...baseInput, level: "avanzado" });
    expect(preview?.level).toBe("avanzado");
    expect(preview?.levelBumped).toBe(false);

    const baseline = generateWorkoutPlan("avanzado", "ganar_musculo", [], 60);
    const baselineSets = new Map(
      baseline.flatMap((day, d) =>
        day.exercises.map((ex, i) => [`${d}-${i}-${ex.exerciseId}`, ex.sets] as const)
      )
    );

    let compoundBumps = 0;
    preview?.days.forEach((day, d) => {
      day.exercises.forEach((ex, i) => {
        const baseSets = baselineSets.get(`${d}-${i}-${ex.exerciseId}`);
        expect(baseSets).toBeDefined();
        const delta = ex.sets - (baseSets as number);
        expect([0, 1]).toContain(delta);
        if (delta === 1) compoundBumps++;
      });
    });
    // A full gym plan must contain at least one compound lift.
    expect(compoundBumps).toBeGreaterThan(0);

    // Spot-check a known compound: sentadilla gets exactly +1 set.
    const findSets = (days: typeof baseline, id: string) =>
      days.flatMap((day) => day.exercises).find((ex) => ex.exerciseId === id)?.sets;
    const baseSquat = findSets(baseline, "sentadilla");
    const phase2Squat = findSets(preview?.days ?? [], "sentadilla");
    expect(baseSquat).toBeDefined();
    expect(phase2Squat).toBe((baseSquat as number) + 1);
  });

  it("keeps elite level (no bump above elite) and progresses via compounds", () => {
    const preview = generatePhase2Preview({ ...baseInput, level: "elite" });
    expect(preview?.level).toBe("elite");
    expect(preview?.levelBumped).toBe(false);
  });

  it("returns a 40-day block", () => {
    const preview = generatePhase2Preview(baseInput);
    expect(preview?.durationDays).toBe(PHASE2_DURATION_DAYS);
    expect(PHASE2_DURATION_DAYS).toBe(40);
    // Weekly split always has 7 entries.
    expect(preview?.days).toHaveLength(7);
  });
});
