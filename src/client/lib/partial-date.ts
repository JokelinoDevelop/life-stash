import {
  isIsoDate,
  normalizePartialDate,
  parseIsoDate,
} from "@shared/domain/dates";
import type { DatePrecision } from "@shared/domain/dates";

/** Form value of a date that may only be known to the month or year. */
export interface PartialDateValue {
  precision: DatePrecision;
  /** `YYYY-MM-DD`, used when precision is "day". */
  date: string;
  /** "1"–"12", used when precision is "month". */
  month: string;
  /** Four-digit year, used for "month" and "year". */
  year: string;
}

export const partialDateFromIso = (
  iso: string,
  precision: DatePrecision = "day"
): PartialDateValue => {
  const { year, month } = parseIsoDate(iso);

  return { date: iso, month: String(month), year: String(year), precision };
};

export const emptyPartialDate = (today: string): PartialDateValue =>
  partialDateFromIso(today);

const YEAR = /^\d{4}$/u;

/** Converts the form value to a normalised ISO date, or null when incomplete/invalid. */
export const partialDateToIso = (
  value: PartialDateValue
): { date: string; precision: DatePrecision } | null => {
  if (value.precision === "day") {
    return isIsoDate(value.date)
      ? { date: value.date, precision: "day" }
      : null;
  }

  if (!YEAR.test(value.year)) {
    return null;
  }

  const year = Number(value.year);

  if (value.precision === "year") {
    return { date: normalizePartialDate("year", { year }), precision: "year" };
  }

  const month = Number(value.month);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    date: normalizePartialDate("month", { month, year }),
    precision: "month",
  };
};

export const todayIso = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
};
