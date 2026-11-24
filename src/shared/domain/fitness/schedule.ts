import { addDays, daysBetween, parseIsoDate } from "../dates";

/** ISO weekdays: 1 = Monday … 7 = Sunday. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const isWeekday = (value: number): value is Weekday =>
  WEEKDAYS.some((day) => day === value);

/** `Date.getUTCDay()` (Sunday = 0) → ISO weekday. */
const FROM_JS_DAY = [7, 1, 2, 3, 4, 5, 6] as const;

/** The ISO weekday of a `YYYY-MM-DD` date. */
export const isoWeekday = (date: string): Weekday => {
  const { year, month, day } = parseIsoDate(date);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return FROM_JS_DAY[jsDay] ?? 7;
};

/** Monday of the ISO week that contains `date`. */
export const startOfIsoWeek = (date: string): string =>
  addDays(date, 1 - isoWeekday(date));

/** Weekdays sorted and without duplicates (how they are stored). */
export const normalizeWeekdays = (weekdays: readonly number[]): Weekday[] =>
  [...new Set(weekdays)].filter(isWeekday).toSorted((a, b) => a - b);

export interface WeeklyRule {
  weekdays: readonly number[];
  startDate: string;
  /** Last day the rule applies (inclusive); null while it runs. */
  endDate: string | null;
}

/** Every date in `from`…`to` (inclusive) the rule falls on. Nothing is generated ahead. */
export const expandSchedule = (
  rule: WeeklyRule,
  from: string,
  to: string
): string[] => {
  const first = rule.startDate > from ? rule.startDate : from;
  const last = rule.endDate !== null && rule.endDate < to ? rule.endDate : to;

  if (first > last || rule.weekdays.length === 0) {
    return [];
  }

  const days = new Set(rule.weekdays);
  const dates: string[] = [];
  const span = daysBetween(first, last);

  for (let offset = 0; offset <= span; offset += 1) {
    const date = addDays(first, offset);

    if (days.has(isoWeekday(date))) {
      dates.push(date);
    }
  }

  return dates;
};

export type StoredStatus = "planned" | "done" | "skipped";

export type CalendarStatus = StoredStatus | "missed";

/** An occurrence of a schedule that nobody has touched yet. */
export interface VirtualOccurrence {
  scheduleId: string;
  trainingId: string;
  date: string;
}

/** A `fitness_sessions` row, reduced to what the calendar needs. */
export interface StoredOccurrence {
  id: string;
  scheduleId: string | null;
  originalDate: string | null;
  trainingId: string | null;
  title: string | null;
  date: string;
  status: StoredStatus;
  durationMinutes: number | null;
  note: string | null;
}

export interface CalendarEntry {
  /** Stable key: the session id, or `scheduleId:originalDate` for an untouched occurrence. */
  key: string;
  /** Null until the occurrence is touched. */
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  trainingId: string | null;
  title: string | null;
  date: string;
  status: CalendarStatus;
  durationMinutes: number | null;
  note: string | null;
}

/** "Missed" is derived: still planned on a day before today. Never stored. */
export const deriveStatus = (
  status: StoredStatus,
  date: string,
  today: string
): CalendarStatus => (status === "planned" && date < today ? "missed" : status);

const occurrenceKey = (scheduleId: string, date: string) =>
  `${scheduleId}:${date}`;

/**
 * Untouched occurrences plus stored sessions; a stored row stands in for the occurrence it
 * was written for (even when it moved to another day). Sorted by date.
 */
export const mergeOccurrences = (
  virtual: readonly VirtualOccurrence[],
  stored: readonly StoredOccurrence[],
  today: string
): CalendarEntry[] => {
  const touched = new Set(
    stored.flatMap((row) =>
      row.scheduleId !== null && row.originalDate !== null
        ? [occurrenceKey(row.scheduleId, row.originalDate)]
        : []
    )
  );

  const untouched: CalendarEntry[] = virtual.flatMap((item) =>
    touched.has(occurrenceKey(item.scheduleId, item.date))
      ? []
      : [
          {
            date: item.date,
            durationMinutes: null,
            id: null,
            key: occurrenceKey(item.scheduleId, item.date),
            note: null,
            originalDate: item.date,
            scheduleId: item.scheduleId,
            status: deriveStatus("planned", item.date, today),
            title: null,
            trainingId: item.trainingId,
          },
        ]
  );

  const sessions: CalendarEntry[] = stored.map((row) => ({
    date: row.date,
    durationMinutes: row.durationMinutes,
    id: row.id,
    key: row.id,
    note: row.note,
    originalDate: row.originalDate,
    scheduleId: row.scheduleId,
    status: deriveStatus(row.status, row.date, today),
    title: row.title,
    trainingId: row.trainingId,
  }));

  return [...untouched, ...sessions].toSorted((a, b) =>
    a.date === b.date
      ? a.key.localeCompare(b.key)
      : a.date.localeCompare(b.date)
  );
};
