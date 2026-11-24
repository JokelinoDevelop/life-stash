import { addDays } from "../dates";
import type { CalendarStatus } from "./schedule";
import { startOfIsoWeek } from "./schedule";

export interface ProgressEntry {
  date: string;
  status: CalendarStatus;
}

export interface WeekProgress {
  done: number;
  /** Everything on this week's plan except skipped sessions (excused). */
  scheduled: number;
}

const inWeek = (date: string, monday: string) =>
  date >= monday && date <= addDays(monday, 6);

/** "3 of 4 this week": done sessions out of what this ISO week holds. */
export const weekProgress = (
  entries: readonly ProgressEntry[],
  today: string
): WeekProgress => {
  const monday = startOfIsoWeek(today);

  const week = entries.filter(
    (entry) => inWeek(entry.date, monday) && entry.status !== "skipped"
  );

  return {
    done: week.filter((entry) => entry.status === "done").length,
    scheduled: week.length,
  };
};

type WeekVerdict = "on-plan" | "broken" | "open";

const judgeWeek = (
  entries: readonly ProgressEntry[],
  monday: string
): WeekVerdict => {
  const week = entries.filter((entry) => inWeek(entry.date, monday));

  if (week.some((entry) => entry.status === "missed")) {
    return "broken";
  }

  return week.some((entry) => entry.status === "done") ? "on-plan" : "open";
};

/** Safety stop: never walk back further than this. */
const MAX_WEEKS = 520;

/**
 * Weeks in a row on plan, counting back from this week. A week counts when it has at least
 * one done session and none missed (skipped ones are excused). This week only adds to the
 * streak once it qualifies; while it is still open it doesn't break it.
 */
export const streakWeeks = (
  entries: readonly ProgressEntry[],
  today: string
): number => {
  const thisMonday = startOfIsoWeek(today);
  const current = judgeWeek(entries, thisMonday);

  if (current === "broken") {
    return 0;
  }

  let streak = current === "on-plan" ? 1 : 0;

  for (let week = 1; week <= MAX_WEEKS; week += 1) {
    if (judgeWeek(entries, addDays(thisMonday, -7 * week)) !== "on-plan") {
      break;
    }

    streak += 1;
  }

  return streak;
};
