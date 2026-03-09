/**
 * Sorts slots by duration descending so shorter slots render on top of longer
 * ones in an absolute-positioned calendar grid.
 *
 * Problem: two slots sharing the same start time (e.g. 07:00–08:00 and
 * 07:00–17:00) both receive `top: 0` in the grid. Because the longer slot
 * covers the shorter one's pixel area, whichever is painted last (highest DOM
 * order) wins click events. Sorting longer slots first means shorter slots are
 * painted last → they sit on top and remain clickable.
 *
 * Generic: accepts any array of objects that have `start_time` and `end_time`.
 * Returns a new array; the original is not mutated.
 */
export function sortSlotsByDuration<T extends { start_time: string; end_time: string }>(
  slots: T[]
): T[] {
  return [...slots].sort((a, b) => {
    const durA = getSlotDurationMin(a.start_time, a.end_time);
    const durB = getSlotDurationMin(b.start_time, b.end_time);
    return durB - durA; // descending: longest first
  });
}

/**
 * Returns the duration of a slot in minutes.
 */
export function getSlotDurationMin(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/**
 * Splits a time range into 1-hour blocks.
 * Incomplete trailing blocks (< 60 min) are dropped.
 *
 * Examples:
 *   "07:00" → "21:00"  → 14 blocks
 *   "10:00" → "11:00"  → 1 block: [{start:"10:00", end:"11:00"}]
 *   "07:30" → "08:45"  → 1 block: [{start:"07:30", end:"08:30"}]
 *   "07:00" → "07:30"  → 0 blocks
 */
export function getHourBlocks(startTime: string, endTime: string): Array<{ start: string; end: string }> {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const blocks: Array<{ start: string; end: string }> = [];
  let cur = startMin;

  while (cur + 60 <= endMin) {
    const nxt = cur + 60;
    blocks.push({
      start: `${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`,
      end: `${String(Math.floor(nxt / 60)).padStart(2, "0")}:${String(nxt % 60).padStart(2, "0")}`,
    });
    cur = nxt;
  }

  return blocks;
}
