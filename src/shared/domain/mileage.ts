import { addDays, daysBetween } from "./dates";

export interface OdometerPoint {
  date: string;
  odometerKm: number;
}

/** Sorts readings chronologically; on the same day the higher reading comes last. */
export const sortReadings = <T extends OdometerPoint>(
  points: readonly T[]
): T[] =>
  points.toSorted(
    (a, b) => a.date.localeCompare(b.date) || a.odometerKm - b.odometerKm
  );

/** The reading with the highest odometer value (odometers only go up). */
export const latestOdometer = (
  points: readonly OdometerPoint[]
): OdometerPoint | null => {
  let latest: OdometerPoint | null = null;

  for (const point of points) {
    if (
      latest === null ||
      point.odometerKm > latest.odometerKm ||
      (point.odometerKm === latest.odometerKm && point.date > latest.date)
    ) {
      latest = point;
    }
  }

  return latest;
};

export interface ReadingWithDelta<T extends OdometerPoint> {
  reading: T;
  kmSincePrevious: number | null;
  daysSincePrevious: number | null;
}

/** Adds the distance and days since the previous reading (chronological order). */
export const withDeltas = <T extends OdometerPoint>(
  points: readonly T[]
): ReadingWithDelta<T>[] => {
  const sorted = sortReadings(points);

  return sorted.map((reading, index) => {
    const previous = sorted[index - 1];

    return {
      daysSincePrevious: previous
        ? daysBetween(previous.date, reading.date)
        : null,
      kmSincePrevious: previous
        ? reading.odometerKm - previous.odometerKm
        : null,
      reading,
    };
  });
};

/**
 * Spreads the distance between consecutive readings evenly over the days it covers (after the
 * earlier reading, up to and including the later one) and sums it per bucket. This keeps long
 * gaps — e.g. purchase odometer to first log years later — from landing in a single period.
 */
export const distanceByPeriod = (
  points: readonly OdometerPoint[],
  periodOf: (date: string) => string
): Map<string, number> => {
  const totals = new Map<string, number>();

  const add = (date: string, km: number) => {
    const key = periodOf(date);
    totals.set(key, (totals.get(key) ?? 0) + km);
  };

  for (const { reading, kmSincePrevious, daysSincePrevious } of withDeltas(
    points
  )) {
    if (
      kmSincePrevious !== null &&
      kmSincePrevious > 0 &&
      daysSincePrevious !== null
    ) {
      const days = Math.max(daysSincePrevious, 1);
      const perDay = kmSincePrevious / days;

      for (let offset = days - 1; offset >= 0; offset -= 1) {
        add(addDays(reading.date, -offset), perDay);
      }
    }
  }

  return totals;
};

/** Distance driven per calendar year, rounded to whole km. */
export const distancePerYear = (
  points: readonly OdometerPoint[]
): { year: number; km: number }[] =>
  [...distanceByPeriod(points, (date) => date.slice(0, 4)).entries()]
    .map(([year, km]) => ({ km: Math.round(km), year: Number(year) }))
    .toSorted((a, b) => a.year - b.year);

/** Total distance between the first and the latest reading. */
export const totalDistance = (points: readonly OdometerPoint[]): number => {
  const sorted = sortReadings(points);
  const [first] = sorted;
  const latest = latestOdometer(points);

  return first && latest ? latest.odometerKm - first.odometerKm : 0;
};
