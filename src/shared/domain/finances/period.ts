import {
  addDays,
  addMonths,
  addMonthsKeepingMonthEnd,
  daysBetween,
} from "../dates";

/** An inclusive range of ISO dates. */
export interface DateRange {
  from: string;
  to: string;
}

/** How a range is split into chart bars: months, quarters or whole years. */
export const GRANULARITIES = ["month", "quarter", "year"] as const;

export type Granularity = (typeof GRANULARITIES)[number];

const MONTHS_PER_YEAR = 12;
const MONTHS_PER_QUARTER = 3;

/** Up to two years reads well month by month. */
const MAX_MONTH_BARS = 24;

/** Up to five years reads well quarter by quarter; longer ranges go yearly. */
const MAX_QUARTER_MONTHS = 60;

const monthIndex = (date: string): number =>
  Number(date.slice(0, 4)) * MONTHS_PER_YEAR + Number(date.slice(5, 7)) - 1;

/** Calendar months the range touches (Jan 31 → Feb 1 is 2). Never less than 1. */
export const monthsInRange = (range: DateRange): number =>
  Math.max(1, monthIndex(range.to) - monthIndex(range.from) + 1);

/** The bar size that keeps a chart of `range` readable. */
export const pickGranularity = (range: DateRange): Granularity => {
  const months = monthsInRange(range);

  if (months <= MAX_MONTH_BARS) {
    return "month";
  }

  return months <= MAX_QUARTER_MONTHS ? "quarter" : "year";
};

/** The bucket a date falls in: `2026-03`, `2026-Q1` or `2026`. */
export const bucketKey = (date: string, granularity: Granularity): string => {
  const year = date.slice(0, 4);

  if (granularity === "year") {
    return year;
  }

  if (granularity === "quarter") {
    const quarter =
      Math.floor((Number(date.slice(5, 7)) - 1) / MONTHS_PER_QUARTER) + 1;

    return `${year}-Q${quarter}`;
  }

  return date.slice(0, 7);
};

/** Every bucket key from `range.from` to `range.to`, oldest first. */
export const bucketKeys = (
  range: DateRange,
  granularity: Granularity
): string[] => {
  const keys: string[] = [];
  let cursor = `${range.from.slice(0, 7)}-01`;

  while (cursor <= range.to) {
    const key = bucketKey(cursor, granularity);

    if (keys.at(-1) !== key) {
      keys.push(key);
    }

    cursor = addMonths(cursor, 1);
  }

  return keys;
};

/** The first and last day a bucket key covers. */
export const bucketRange = (key: string): DateRange => {
  const year = key.slice(0, 4);

  if (key.length === 4) {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }

  if (key.includes("Q")) {
    const quarter = Number(key.slice(6));
    const from = `${year}-${String((quarter - 1) * MONTHS_PER_QUARTER + 1).padStart(2, "0")}-01`;

    return { from, to: addDays(addMonths(from, MONTHS_PER_QUARTER), -1) };
  }

  const from = `${key}-01`;

  return { from, to: addDays(addMonths(from, 1), -1) };
};

/**
 * The period just before `range`, of the same length, for "vs previous period".
 * Ranges that start on the 1st shift by whole months (a year → the year before,
 * last 12 months → the 12 before); others shift by their length in days.
 */
export const previousRange = (range: DateRange): DateRange => {
  if (range.from.endsWith("-01")) {
    const months = monthsInRange(range);

    return {
      from: addMonths(range.from, -months),
      to: addMonthsKeepingMonthEnd(range.to, -months),
    };
  }

  const days = daysBetween(range.from, range.to) + 1;

  return { from: addDays(range.from, -days), to: addDays(range.from, -1) };
};

/** The year when the range is exactly one calendar year, otherwise null. */
export const wholeYear = (range: DateRange): number | null =>
  range.from.endsWith("-01-01") &&
  range.to.endsWith("-12-31") &&
  range.from.slice(0, 4) === range.to.slice(0, 4)
    ? Number(range.from.slice(0, 4))
    : null;
