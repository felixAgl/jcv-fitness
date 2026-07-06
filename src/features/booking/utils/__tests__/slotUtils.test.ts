import { describe, it, expect } from "vitest";
import { getSlotDurationMin, getHourBlocks, sortSlotsByDuration } from "../slotUtils";

// ─── getSlotDurationMin ────────────────────────────────────────────────────────

describe("getSlotDurationMin", () => {
  it("returns 60 for a 1-hour slot", () => {
    expect(getSlotDurationMin("10:00", "11:00")).toBe(60);
  });

  it("returns 60 for boundary case exactly 1 hour", () => {
    expect(getSlotDurationMin("07:00", "08:00")).toBe(60);
  });

  it("returns 120 for a 2-hour slot", () => {
    expect(getSlotDurationMin("07:00", "09:00")).toBe(120);
  });

  it("returns 840 for all-day slot (7am–9pm)", () => {
    expect(getSlotDurationMin("07:00", "21:00")).toBe(840);
  });

  it("returns 30 for a 30-minute slot", () => {
    expect(getSlotDurationMin("07:00", "07:30")).toBe(30);
  });

  it("handles non-zero minutes correctly (10:30 to 12:00 = 90 min)", () => {
    expect(getSlotDurationMin("10:30", "12:00")).toBe(90);
  });

  it("returns 0 for same start and end time", () => {
    expect(getSlotDurationMin("10:00", "10:00")).toBe(0);
  });

  it("returns 61 for a slot just over 1 hour", () => {
    expect(getSlotDurationMin("10:00", "11:01")).toBe(61);
  });

  it("returns 59 for a slot just under 1 hour", () => {
    expect(getSlotDurationMin("10:00", "10:59")).toBe(59);
  });
});

// ─── getHourBlocks ─────────────────────────────────────────────────────────────

describe("getHourBlocks", () => {
  it("returns 1 block for a 1-hour slot", () => {
    const blocks = getHourBlocks("10:00", "11:00");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ start: "10:00", end: "11:00" });
  });

  it("returns 2 blocks for a 2-hour slot", () => {
    const blocks = getHourBlocks("07:00", "09:00");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ start: "07:00", end: "08:00" });
    expect(blocks[1]).toEqual({ start: "08:00", end: "09:00" });
  });

  it("returns 14 blocks for all-day slot (7am–9pm)", () => {
    const blocks = getHourBlocks("07:00", "21:00");
    expect(blocks).toHaveLength(14);
    expect(blocks[0]).toEqual({ start: "07:00", end: "08:00" });
    expect(blocks[13]).toEqual({ start: "20:00", end: "21:00" });
  });

  // The bug case: trainer sets 7am–all-day, user selects 10am
  it("contains a 10:00–11:00 block in an all-day slot (real booking case)", () => {
    const blocks = getHourBlocks("07:00", "21:00");
    const tenAm = blocks.find((b) => b.start === "10:00");
    expect(tenAm).toEqual({ start: "10:00", end: "11:00" });
  });

  it("returns 0 blocks for a 30-minute slot (too short)", () => {
    const blocks = getHourBlocks("07:00", "07:30");
    expect(blocks).toHaveLength(0);
  });

  it("returns 0 blocks for same start and end time", () => {
    const blocks = getHourBlocks("10:00", "10:00");
    expect(blocks).toHaveLength(0);
  });

  it("returns 0 blocks for a 59-minute slot (just under 1 hour)", () => {
    const blocks = getHourBlocks("10:00", "10:59");
    expect(blocks).toHaveLength(0);
  });

  // Edge: non-aligned start time
  it("handles 7:30–9:30 → 2 blocks aligned to start", () => {
    const blocks = getHourBlocks("07:30", "09:30");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ start: "07:30", end: "08:30" });
    expect(blocks[1]).toEqual({ start: "08:30", end: "09:30" });
  });

  // Edge: incomplete last block is dropped
  it("drops incomplete trailing block (7:30–8:45 → 1 block, last 15 min cut)", () => {
    const blocks = getHourBlocks("07:30", "08:45");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ start: "07:30", end: "08:30" });
  });

  it("block time strings are zero-padded to HH:MM format", () => {
    const blocks = getHourBlocks("07:00", "09:00");
    expect(blocks[0].start).toBe("07:00");
    expect(blocks[0].end).toBe("08:00");
  });

  it("correctly pads single-digit minutes", () => {
    const blocks = getHourBlocks("07:05", "09:05");
    expect(blocks[0]).toEqual({ start: "07:05", end: "08:05" });
    expect(blocks[1]).toEqual({ start: "08:05", end: "09:05" });
  });

  it("returns blocks in chronological order", () => {
    const blocks = getHourBlocks("08:00", "12:00");
    const starts = blocks.map((b) => b.start);
    expect(starts).toEqual(["08:00", "09:00", "10:00", "11:00"]);
  });

  // Consistency: each block's end = next block's start
  it("blocks are contiguous (each end equals next start)", () => {
    const blocks = getHourBlocks("07:00", "12:00");
    for (let i = 0; i < blocks.length - 1; i++) {
      expect(blocks[i].end).toBe(blocks[i + 1].start);
    }
  });
});

// ─── sortSlotsByDuration ───────────────────────────────────────────────────────

type MinSlot = { id: string; start_time: string; end_time: string };

function slot(id: string, start: string, end: string): MinSlot {
  return { id, start_time: start, end_time: end };
}

describe("sortSlotsByDuration", () => {
  // ── The exact reported bug ─────────────────────────────────────────────────
  it("puts the long slot (07:00–17:00) before the short one (07:00–08:00)", () => {
    const slots = [
      slot("short", "07:00", "08:00"),  // 60 min — this one couldn't be clicked
      slot("long",  "07:00", "17:00"),  // 600 min
    ];
    const sorted = sortSlotsByDuration(slots);
    expect(sorted[0].id).toBe("long");
    expect(sorted[1].id).toBe("short");
  });

  // ── Inverse input order should produce the same result ─────────────────────
  it("is stable regardless of input order", () => {
    const a = [slot("long", "07:00", "17:00"), slot("short", "07:00", "08:00")];
    const b = [slot("short", "07:00", "08:00"), slot("long", "07:00", "17:00")];
    expect(sortSlotsByDuration(a).map((s) => s.id))
      .toEqual(sortSlotsByDuration(b).map((s) => s.id));
  });

  // ── Three slots with different durations ──────────────────────────────────
  it("sorts three slots from longest to shortest", () => {
    const slots = [
      slot("1h",  "09:00", "10:00"),  // 60 min
      slot("10h", "07:00", "17:00"),  // 600 min
      slot("2h",  "08:00", "10:00"),  // 120 min
    ];
    const ids = sortSlotsByDuration(slots).map((s) => s.id);
    expect(ids).toEqual(["10h", "2h", "1h"]);
  });

  // ── Slots with identical durations keep a stable relative order ────────────
  it("does not reorder slots that have equal duration", () => {
    const slots = [
      slot("a", "08:00", "09:00"),  // 60 min
      slot("b", "10:00", "11:00"),  // 60 min
      slot("c", "14:00", "15:00"),  // 60 min
    ];
    const ids = sortSlotsByDuration(slots).map((s) => s.id);
    // All same duration → original order preserved
    expect(ids).toEqual(["a", "b", "c"]);
  });

  // ── Different start times, overlapping visually ───────────────────────────
  it("handles slots starting at different hours but overlapping (e.g. 09:00–12:00 vs 10:00–10:30)", () => {
    const slots = [
      slot("short", "10:00", "10:30"),  // 30 min
      slot("long",  "09:00", "12:00"),  // 180 min
    ];
    const sorted = sortSlotsByDuration(slots);
    expect(sorted[0].id).toBe("long");
    expect(sorted[1].id).toBe("short");
  });

  // ── Returns a new array; does not mutate the original ─────────────────────
  it("does not mutate the original array", () => {
    const slots = [
      slot("short", "07:00", "08:00"),
      slot("long",  "07:00", "17:00"),
    ];
    const original = [...slots];
    sortSlotsByDuration(slots);
    expect(slots[0].id).toBe(original[0].id);
    expect(slots[1].id).toBe(original[1].id);
  });

  // ── Edge: empty array ─────────────────────────────────────────────────────
  it("returns empty array unchanged", () => {
    expect(sortSlotsByDuration([])).toEqual([]);
  });

  // ── Edge: single slot ─────────────────────────────────────────────────────
  it("returns single-element array unchanged", () => {
    const slots = [slot("only", "10:00", "11:00")];
    expect(sortSlotsByDuration(slots)).toEqual(slots);
  });

  // ── Generic constraint: works with extra properties ───────────────────────
  it("preserves all extra properties on each slot object", () => {
    const slots = [
      { id: "a", start_time: "10:00", end_time: "12:00", title: "Long" },
      { id: "b", start_time: "10:00", end_time: "11:00", title: "Short" },
    ];
    const sorted = sortSlotsByDuration(slots);
    expect(sorted[0].title).toBe("Long");
    expect(sorted[1].title).toBe("Short");
  });
});
