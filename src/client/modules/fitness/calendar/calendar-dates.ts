import { addDays, parseIsoDate } from "@shared/domain/dates";
import { startOfIsoWeek } from "@shared/domain/fitness/schedule";

const pad = (value: number) => String(value).padStart(2, "0");

/** A calendar `Date` (local midnight) as `YYYY-MM-DD`. */
export const isoOfLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** `YYYY-MM-DD` as a local-midnight `Date` for the day picker. */
export const localOfIso = (iso: string): Date => {
  const { year, month, day } = parseIsoDate(iso);

  return new Date(year, month - 1, day);
};

/** The month grid always shows six weeks from the Monday on or before the 1st. */
const GRID_DAYS = 42;

/** The dates the calendar shows for a month (`YYYY-MM`). */
export const calendarRange = (month: string) => {
  const from = startOfIsoWeek(`${month}-01`);

  return { from, to: addDays(from, GRID_DAYS - 1) };
};
