import type { WeightRow } from "../weight.repository";

export interface ListWeightResponse {
  /** Oldest first. */
  entries: {
    id: string;
    date: string;
    weightGrams: number;
    note: string | null;
  }[];
}

export const toListWeightResponse = (
  rows: readonly WeightRow[]
): ListWeightResponse => ({
  entries: rows.map((row) => ({
    date: row.date,
    id: row.id,
    note: row.note,
    weightGrams: row.weightGrams,
  })),
});
