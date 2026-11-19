/**
 * Calendar dates are plain `YYYY-MM-DD` strings throughout the app.
 */
export const DATE_PRECISIONS = ["day", "month", "year"] as const;

export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;

const pad = (value: number, length = 2): string =>
  String(value).padStart(length, "0");

const matchParts = (value: string): DateParts | null => {
  const groups = ISO_DATE.exec(value)?.groups;

  if (!groups) {
    return null;
  }

  return {
    day: Number(groups.day),
    month: Number(groups.month),
    year: Number(groups.year),
  };
};

export const isIsoDate = (value: string): boolean => {
  const parts = matchParts(value);

  if (!parts) {
    return false;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() + 1 === parts.month &&
    date.getUTCDate() === parts.day
  );
};

export const parseIsoDate = (value: string): DateParts => {
  const parts = matchParts(value);

  if (!parts) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  return parts;
};

export interface PartialDateInput {
  year: number;
  month?: number;
  day?: number;
}

/** Normalises a (partial) date so it sorts correctly: month → 1st of month, year → 1 Jan. */
export const normalizePartialDate = (
  precision: DatePrecision,
  parts: PartialDateInput
): string => {
  const month = precision === "year" ? 1 : (parts.month ?? 1);
  const day = precision === "day" ? (parts.day ?? 1) : 1;

  return `${pad(parts.year, 4)}-${pad(month)}-${pad(day)}`;
};

/** Formats a date for display as day.month.year, showing only the known part. */
export const formatPartialDate = (
  date: string,
  precision: DatePrecision = "day"
): string => {
  const { year, month, day } = parseIsoDate(date);

  if (precision === "year") {
    return String(year);
  }

  if (precision === "month") {
    return `${pad(month)}.${year}`;
  }

  return `${pad(day)}.${pad(month)}.${year}`;
};

/**
 * Like `formatPartialDate` without the year, for rows under a year or month
 * heading: "19.07". Month and year precision keep their full form.
 */
export const formatShortDate = (
  date: string,
  precision: DatePrecision = "day"
): string => {
  if (precision !== "day") {
    return formatPartialDate(date, precision);
  }

  const { month, day } = parseIsoDate(date);

  return `${pad(day)}.${pad(month)}`;
};

/** Today's calendar date in the given IANA time zone. */
export const todayInTimeZone = (
  zone: string,
  now: Date = new Date()
): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: zone,
    year: "numeric",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const toUtc = (date: string): number => {
  const { year, month, day } = parseIsoDate(date);

  return Date.UTC(year, month - 1, day);
};

const fromUtc = (time: number): string => {
  const date = new Date(time);
  const year = pad(date.getUTCFullYear(), 4);

  return `${year}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const MS_PER_DAY = 86_400_000;

export const addDays = (date: string, days: number): string =>
  fromUtc(toUtc(date) + days * MS_PER_DAY);

/** Adds calendar months, clamping to the last day of the target month (31 Jan + 1 → 28/29 Feb). */
export const addMonths = (date: string, months: number): string => {
  const { year, month, day } = parseIsoDate(date);
  const targetMonthIndex = month - 1 + months;

  const lastDay = new Date(
    Date.UTC(year, targetMonthIndex + 1, 0)
  ).getUTCDate();

  return fromUtc(Date.UTC(year, targetMonthIndex, Math.min(day, lastDay)));
};

/**
 * Like `addMonths`, but a month's last day stays the last day (31.05 → 30.06 → 31.07), so
 * month-end dates don't drift when stepped one month at a time.
 */
export const addMonthsKeepingMonthEnd = (
  date: string,
  months: number
): string =>
  addDays(date, 1).slice(8, 10) === "01"
    ? addDays(addMonths(addDays(date, 1), months), -1)
    : addMonths(date, months);

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string): number =>
  Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);

export const yearOf = (date: string): number => parseIsoDate(date).year;

const TYPED_DATE =
  /^(?<day>\d{1,2})[./-](?<month>\d{1,2})[./-](?<year>\d{4})$/u;

/**
 * A date the user typed: `2026-11-19` or day-first `19.11.2026`, `19/11/2026`,
 * `19-11-2026`. Returns the ISO date, or null when it isn't a real date.
 */
export const parseTypedDate = (text: string): string | null => {
  const value = text.trim();

  if (isIsoDate(value)) {
    return value;
  }

  const groups = TYPED_DATE.exec(value)?.groups;

  if (!groups) {
    return null;
  }

  const iso = `${groups.year}-${pad(Number(groups.month))}-${pad(Number(groups.day))}`;

  return isIsoDate(iso) ? iso : null;
};
