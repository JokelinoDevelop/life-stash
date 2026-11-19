import { daysBetween } from "@shared/domain/dates";

const DAYS_PER_YEAR = 365.25;

/** People drive ~30% more in summer than in winter. */
const SEASONAL_SWING = 0.3;

/** Day 0 of the seasonal cycle: 1 January, the low point. */
const SEASON_EPOCH = "2000-01-01";

export interface MileageInput {
  /** The day the car joined the household. */
  from: string;
  /** Odometer on `from`. */
  startKm: number;
  kmPerYear: number;
  /** The last day the car was driven (sale date or today). */
  until: string;
}

/** The odometer reading on a given date. Dates outside the ownership window are clamped. */
export type Mileage = (date: string) => number;

/**
 * A smooth, always-increasing odometer curve. The daily distance follows
 * `kmPerDay · (1 − swing · cos(2π · t / year))`, so it peaks in July; this is its integral.
 */
export const createMileage = ({
  from,
  startKm,
  kmPerYear,
  until,
}: MileageInput): Mileage => {
  const kmPerDay = kmPerYear / DAYS_PER_YEAR;
  const angularSpeed = (2 * Math.PI) / DAYS_PER_YEAR;

  const distanceSinceEpoch = (day: number) =>
    kmPerDay *
    (day - (SEASONAL_SWING / angularSpeed) * Math.sin(angularSpeed * day));

  const firstDay = daysBetween(SEASON_EPOCH, from);
  const lastDay = daysBetween(SEASON_EPOCH, until);

  return (date) => {
    const day = Math.min(
      Math.max(daysBetween(SEASON_EPOCH, date), firstDay),
      lastDay
    );

    return Math.round(
      startKm + distanceSinceEpoch(day) - distanceSinceEpoch(firstDay)
    );
  };
};
