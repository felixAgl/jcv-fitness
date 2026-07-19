import { describe, it, expect } from "vitest";
import {
  upsertSet,
  getLogsForExercise,
  getLastSessionFor,
  detectPR,
  epley1RM,
  getSessionMaxes,
  buildSparklinePoints,
} from "../workout-log";
import type { LoggedSet } from "../../types";

function set(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    date: "2026-07-10",
    exerciseId: "bench-press",
    setIndex: 0,
    reps: 10,
    weightKg: 40,
    ...overrides,
  };
}

describe("upsertSet (logSet idempotence)", () => {
  it("appends a new set", () => {
    const log = upsertSet([], set());
    expect(log).toHaveLength(1);
  });

  it("replaces the entry with the same date+exercise+setIndex instead of duplicating", () => {
    const first = upsertSet([], set({ reps: 10, weightKg: 40 }));
    const second = upsertSet(first, set({ reps: 8, weightKg: 42.5 }));
    expect(second).toHaveLength(1);
    expect(second[0].reps).toBe(8);
    expect(second[0].weightKg).toBe(42.5);
  });

  it("appends when only the setIndex differs", () => {
    const log = upsertSet(upsertSet([], set({ setIndex: 0 })), set({ setIndex: 1 }));
    expect(log).toHaveLength(2);
  });

  it("appends when only the date differs", () => {
    const log = upsertSet(upsertSet([], set({ date: "2026-07-10" })), set({ date: "2026-07-12" }));
    expect(log).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const original = [set()];
    upsertSet(original, set({ reps: 99 }));
    expect(original[0].reps).toBe(10);
  });
});

describe("getLogsForExercise / getLastSessionFor", () => {
  const log: LoggedSet[] = [
    set({ date: "2026-07-12", setIndex: 0, weightKg: 42.5 }),
    set({ date: "2026-07-10", setIndex: 1, weightKg: 40 }),
    set({ date: "2026-07-10", setIndex: 0, weightKg: 40 }),
    set({ exerciseId: "squat", date: "2026-07-12", weightKg: 80 }),
  ];

  it("filters by exercise and sorts by date then setIndex", () => {
    const bench = getLogsForExercise(log, "bench-press");
    expect(bench.map((s) => `${s.date}:${s.setIndex}`)).toEqual([
      "2026-07-10:0",
      "2026-07-10:1",
      "2026-07-12:0",
    ]);
  });

  it("returns the latest session with its sets", () => {
    const last = getLastSessionFor(log, "bench-press");
    expect(last?.date).toBe("2026-07-12");
    expect(last?.sets).toHaveLength(1);
  });

  it("excludes today so the placeholder shows the previous session", () => {
    const last = getLastSessionFor(log, "bench-press", "2026-07-12");
    expect(last?.date).toBe("2026-07-10");
    expect(last?.sets).toHaveLength(2);
  });

  it("returns null when the exercise has no logs", () => {
    expect(getLastSessionFor(log, "deadlift")).toBeNull();
  });
});

describe("epley1RM", () => {
  it("computes weight * (1 + reps/30)", () => {
    expect(epley1RM(60, 10)).toBeCloseTo(80);
    expect(epley1RM(100, 1)).toBeCloseTo(103.333, 2);
  });
});

describe("detectPR", () => {
  it("is not a PR on the first ever log of an exercise", () => {
    const result = detectPR([], set({ weightKg: 100 }));
    expect(result.isPR).toBe(false);
  });

  it("detects a max-weight PR", () => {
    const log = [set({ date: "2026-07-10", weightKg: 40, reps: 10 })];
    const result = detectPR(log, set({ date: "2026-07-12", weightKg: 42.5, reps: 8 }));
    expect(result.isPR).toBe(true);
    expect(result.weightPR).toBe(true);
    expect(result.weightKg).toBe(42.5);
  });

  it("detects an Epley e1RM PR even when the weight is not a record", () => {
    // Prior: 50kg x 5 -> e1RM 58.33. Candidate: 45kg x 12 -> e1RM 63.
    const log = [set({ date: "2026-07-10", weightKg: 50, reps: 5 })];
    const result = detectPR(log, set({ date: "2026-07-12", weightKg: 45, reps: 12 }));
    expect(result.weightPR).toBe(false);
    expect(result.e1rmPR).toBe(true);
    expect(result.isPR).toBe(true);
    expect(result.e1rm).toBeCloseTo(63);
  });

  it("is not a PR when neither weight nor e1RM improves", () => {
    const log = [set({ date: "2026-07-10", weightKg: 50, reps: 10 })];
    const result = detectPR(log, set({ date: "2026-07-12", weightKg: 40, reps: 10 }));
    expect(result.isPR).toBe(false);
  });

  it("ignores other exercises when comparing", () => {
    const log = [set({ exerciseId: "squat", weightKg: 200, reps: 5 })];
    const result = detectPR(log, set({ exerciseId: "bench-press", weightKg: 60, reps: 5, date: "2026-07-12" }));
    // First bench log -> not a PR, and the 200kg squat must not be the baseline.
    expect(result.isPR).toBe(false);
  });

  it("excludes the entry it would replace (typo correction is not a PR against itself)", () => {
    const log = [set({ date: "2026-07-12", setIndex: 0, weightKg: 40, reps: 10 })];
    // Correcting the same set to 45kg: no OTHER prior set exists -> no PR.
    const result = detectPR(log, set({ date: "2026-07-12", setIndex: 0, weightKg: 45, reps: 10 }));
    expect(result.isPR).toBe(false);
  });
});

describe("getSessionMaxes / buildSparklinePoints", () => {
  it("returns max weight per session, oldest first, capped to the limit", () => {
    const log: LoggedSet[] = [];
    for (let day = 1; day <= 10; day++) {
      const date = `2026-07-${String(day).padStart(2, "0")}`;
      log.push(set({ date, setIndex: 0, weightKg: day }));
      log.push(set({ date, setIndex: 1, weightKg: day + 5 }));
    }
    const maxes = getSessionMaxes(log, "bench-press", 8);
    expect(maxes).toHaveLength(8);
    expect(maxes[0]).toEqual({ date: "2026-07-03", maxWeightKg: 8 });
    expect(maxes[7]).toEqual({ date: "2026-07-10", maxWeightKg: 15 });
  });

  it("builds polyline points inside the viewBox", () => {
    const points = buildSparklinePoints([10, 20, 15], 160, 48, 4);
    const pairs = points.split(" ").map((p) => p.split(",").map(Number));
    expect(pairs).toHaveLength(3);
    for (const [x, y] of pairs) {
      expect(x).toBeGreaterThanOrEqual(4);
      expect(x).toBeLessThanOrEqual(156);
      expect(y).toBeGreaterThanOrEqual(4);
      expect(y).toBeLessThanOrEqual(44);
    }
    // Max value maps to the top (smallest y).
    expect(pairs[1][1]).toBeLessThan(pairs[0][1]);
  });

  it("draws a centered flat line for a constant series and handles empty input", () => {
    const flat = buildSparklinePoints([40, 40], 160, 48);
    for (const pair of flat.split(" ")) {
      expect(Number(pair.split(",")[1])).toBe(24);
    }
    expect(buildSparklinePoints([], 160, 48)).toBe("");
  });
});
