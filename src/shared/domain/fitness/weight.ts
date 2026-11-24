import { addDays } from "../dates";

const GRAMS_PER_KG = 1000;

/** Stored grams → kilograms for display (e.g. 81_450 → 81.45). */
export const gramsToKg = (grams: number): number => grams / GRAMS_PER_KG;

/** Kilograms typed by the user → whole grams for storage. */
export const kgToGrams = (kg: number): number => Math.round(kg * GRAMS_PER_KG);

export interface WeightPoint {
  date: string;
  weightGrams: number;
}

/**
 * Change from the last entry on or before `days` ago to the latest entry, in grams
 * (negative = lost weight). Null when there is no entry that far back.
 */
export const weightChange = (
  entries: readonly WeightPoint[],
  days: number
): number | null => {
  const sorted = entries.toSorted((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);

  if (latest === undefined) {
    return null;
  }

  const cutoff = addDays(latest.date, -days);
  const baseline = sorted.findLast((entry) => entry.date <= cutoff);

  return baseline === undefined
    ? null
    : latest.weightGrams - baseline.weightGrams;
};
