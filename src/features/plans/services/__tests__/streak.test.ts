import { describe, it, expect } from "vitest";
import { computeStreak, type StreakOptions } from "../streak";

/**
 * Fixed calendar for determinism (July 2026):
 *   2026-07-06 Mon ... 2026-07-10 Fri, 2026-07-11 Sat, 2026-07-12 Sun, 2026-07-13 Mon
 * Rest days: sabado y domingo (like the 4/5-day splits).
 */
const isWeekendRest = (date: string): boolean => {
  const day = new Date(date + "T12:00:00").getDay();
  return day === 0 || day === 6;
};

const baseOptions: StreakOptions = {
  isRestDay: isWeekendRest,
  today: "2026-07-13", // Monday
  startDate: "2026-07-01",
  freezeUsedOn: null,
};

describe("computeStreak", () => {
  it("counts consecutive completed training days", () => {
    // Thu, Fri completed; Sat/Sun rest; today Mon completed.
    const result = computeStreak(
      ["2026-07-09", "2026-07-10", "2026-07-13"],
      baseOptions
    );
    // Thu + Fri + Sat(rest) + Sun(rest) + Mon = 5
    expect(result.streak).toBe(5);
    expect(result.freezeAvailable).toBe(true);
    expect(result.freezeConsumedOn).toBeNull();
  });

  it("rest days (sabado/domingo) count as automatic streak days", () => {
    // Fri completed, today is Sunday (rest): Fri + Sat + Sun = 3.
    const result = computeStreak(["2026-07-10"], {
      ...baseOptions,
      today: "2026-07-12",
    });
    expect(result.streak).toBe(3);
  });

  it("rest days alone are not a streak (needs at least one completed workout)", () => {
    const result = computeStreak([], { ...baseOptions, today: "2026-07-12" });
    expect(result.streak).toBe(0);
    expect(result.freezeConsumedOn).toBeNull();
  });

  it("today unfinished does not break the streak (grace day)", () => {
    // Thu + Fri completed, today Mon not yet trained.
    const result = computeStreak(["2026-07-09", "2026-07-10"], baseOptions);
    // Fri + Sat + Sun = ... walk: Mon skipped, Sun rest, Sat rest, Fri, Thu = 4
    expect(result.streak).toBe(4);
    expect(result.freezeConsumedOn).toBeNull();
  });

  it("a single gap consumes the freeze and keeps the streak alive", () => {
    // Wed, Thu completed; Fri MISSED; Sat/Sun rest; Mon completed.
    const result = computeStreak(
      ["2026-07-08", "2026-07-09", "2026-07-13"],
      baseOptions
    );
    // Mon + Sun + Sat + [Fri frozen, no count] + Thu + Wed = 5
    expect(result.streak).toBe(5);
    expect(result.freezeConsumedOn).toBe("2026-07-10");
    expect(result.freezeAvailable).toBe(false);
  });

  it("an already-persisted freeze date stays covered without re-consuming", () => {
    const result = computeStreak(
      ["2026-07-08", "2026-07-09", "2026-07-13"],
      { ...baseOptions, freezeUsedOn: "2026-07-10" }
    );
    expect(result.streak).toBe(5);
    expect(result.freezeConsumedOn).toBeNull(); // nothing new to persist
    expect(result.freezeAvailable).toBe(false);
  });

  it("a gap after the freeze was consumed breaks the streak", () => {
    // Freeze already used on Fri 2026-07-10. Thu 07-09 MISSED, Wed completed, Mon completed.
    const result = computeStreak(
      ["2026-07-08", "2026-07-13"],
      { ...baseOptions, freezeUsedOn: "2026-07-10" }
    );
    // Mon + Sun + Sat + [Fri frozen] -> Thu missed, freeze gone -> break. Streak = 3.
    expect(result.streak).toBe(3);
    expect(result.freezeAvailable).toBe(false);
    expect(result.freezeConsumedOn).toBeNull();
  });

  it("two missed days break the streak; the freeze is refunded, not wasted", () => {
    // Thu and Fri both missed; Wed completed; Mon completed.
    const result = computeStreak(
      ["2026-07-08", "2026-07-13"],
      baseOptions
    );
    // Mon + Sun + Sat = 3. The freeze cannot bridge a 2-day gap, so it is
    // refunded (it protected nothing) and stays available for a future
    // single-day gap.
    expect(result.streak).toBe(3);
    expect(result.freezeConsumedOn).toBeNull();
    expect(result.freezeAvailable).toBe(true);
  });

  it("refunds the freeze when there is nothing older to protect", () => {
    // Only Mon completed; Fri missed; nothing before Fri.
    const result = computeStreak(["2026-07-13"], {
      ...baseOptions,
      startDate: "2026-07-10", // plan started the missed Friday
    });
    // Mon + Sun + Sat = 3; Fri gap protects nothing -> freeze kept.
    expect(result.streak).toBe(3);
    expect(result.freezeConsumedOn).toBeNull();
    expect(result.freezeAvailable).toBe(true);
  });

  it("never walks before the plan start date", () => {
    const result = computeStreak(["2026-07-13"], {
      ...baseOptions,
      startDate: "2026-07-13",
    });
    expect(result.streak).toBe(1);
  });
});
