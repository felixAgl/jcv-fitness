/**
 * Racha 40: current streak of consecutive "streak days", walking backwards
 * from today.
 *
 * Rules (deterministic):
 * - A streak day is either a training day marked completed OR a rest day.
 *   Rest days come from the plan's weekly split: workoutPlan[dayOfWeekIndex]
 *   with Monday = index 0 (e.g. sabado/domingo in the 4- and 5-day splits,
 *   same mapping TrackingCalendar.isRestDay uses). Rest days count
 *   automatically, but a streak must contain at least one completed workout,
 *   otherwise it is 0 (a weekend alone is not a streak).
 * - Today gets grace: an unfinished training day today neither counts nor
 *   breaks the streak (the day is not over yet).
 * - ONE "congelador" (freeze) per plan: a single missed training day does not
 *   break the streak if the freeze is unused. The frozen day itself does not
 *   count towards the streak. Consumption is persisted in
 *   plan_data.progress.streakFreeze via progress-service, so it survives
 *   reloads and is never granted twice.
 * - The freeze is only actually consumed if it protects something: when no
 *   streak days exist on the older side of the gap, the freeze is refunded
 *   and the streak simply ends at the gap.
 */

export interface StreakOptions {
  /** Rest-day predicate for a YYYY-MM-DD date (derived from the weekly split). */
  isRestDay: (date: string) => boolean;
  /** Today as YYYY-MM-DD (injected for determinism/testing). */
  today: string;
  /** Plan start date as YYYY-MM-DD; the walk never goes before it. */
  startDate: string;
  /** Date the freeze was already consumed on (from persisted metadata), if any. */
  freezeUsedOn?: string | null;
}

export interface StreakResult {
  /** Current streak in days (completed training days + rest days). */
  streak: number;
  /** True while the single freeze has not been consumed. */
  freezeAvailable: boolean;
  /**
   * Set when THIS computation needed the freeze for a missed day that was not
   * yet persisted. The caller should persist it and show the one-time notice.
   */
  freezeConsumedOn: string | null;
}

function previousDay(date: string): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function computeStreak(
  completedDates: string[],
  options: StreakOptions
): StreakResult {
  const completed = new Set(completedDates);
  const { isRestDay, today, startDate } = options;
  const freezeUsedOn = options.freezeUsedOn ?? null;

  let streak = 0;
  let completedCount = 0;
  let freezeConsumedOn: string | null = null;
  let streakAtFreeze = 0;

  let date = today;

  // Grace for today: an unfinished training day today is skipped, not a break.
  if (date >= startDate && !isRestDay(date) && !completed.has(date)) {
    date = previousDay(date);
  }

  while (date >= startDate) {
    if (completed.has(date)) {
      streak += 1;
      completedCount += 1;
    } else if (isRestDay(date)) {
      streak += 1;
    } else if (freezeUsedOn === date) {
      // Previously frozen day: covered, does not count.
    } else if (!freezeUsedOn && freezeConsumedOn === null) {
      // Tentatively spend the freeze on this single missed day.
      freezeConsumedOn = date;
      streakAtFreeze = streak;
    } else {
      break;
    }
    date = previousDay(date);
  }

  // A streak needs at least one completed workout (rest days alone are not a streak).
  if (completedCount === 0) {
    return { streak: 0, freezeAvailable: !freezeUsedOn, freezeConsumedOn: null };
  }

  // Refund the freeze if it protected nothing (no streak days beyond the gap).
  if (freezeConsumedOn !== null && streak === streakAtFreeze) {
    freezeConsumedOn = null;
  }

  return {
    streak,
    freezeAvailable: !freezeUsedOn && freezeConsumedOn === null,
    freezeConsumedOn,
  };
}
