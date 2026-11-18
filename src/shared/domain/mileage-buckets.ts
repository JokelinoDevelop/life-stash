import { addMonths } from "./dates";
import { distanceByPeriod, withDeltas } from "./mileage";
import type { OdometerPoint } from "./mileage";

export interface MonthDistance {
  /** `YYYY-MM` */
  month: string;
  km: number;
}

/**
 * Distance driven per calendar month for the last `months` months up to `today`.
 * Distance between readings is spread over the days it covers (see `distanceByPeriod`).
 */
export const distancePerMonth = (
  points: readonly OdometerPoint[],
  today: string,
  months = 12
): MonthDistance[] => {
  const firstMonth = addMonths(`${today.slice(0, 7)}-01`, -(months - 1));
  const buckets = new Map<string, number>();

  for (let index = 0; index < months; index += 1) {
    buckets.set(addMonths(firstMonth, index).slice(0, 7), 0);
  }

  const spread = distanceByPeriod(points, (date) => date.slice(0, 7));

  return [...buckets.keys()].map((month) => ({
    km: Math.round(spread.get(month) ?? 0),
    month,
  }));
};

/** Average distance per month between the first and the latest reading. */
export const averagePerMonth = (
  points: readonly OdometerPoint[]
): number | null => {
  const deltas = withDeltas(points);
  const first = deltas.at(0)?.reading;
  const last = deltas.at(-1)?.reading;

  if (!first || !last || first.date === last.date) {
    return null;
  }

  const days =
    (Date.parse(`${last.date}T00:00:00Z`) -
      Date.parse(`${first.date}T00:00:00Z`)) /
    86_400_000;

  const AVERAGE_DAYS_PER_MONTH = 30.44;

  return Math.round(
    ((last.odometerKm - first.odometerKm) / days) * AVERAGE_DAYS_PER_MONTH
  );
};
