/** Visits (newest first) grouped by year, in order. */
export const groupByYear = <T extends { date: string }>(
  visits: readonly T[]
): [string, T[]][] => {
  const groups = new Map<string, T[]>();

  for (const visit of visits) {
    const year = visit.date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), visit]);
  }

  return [...groups.entries()];
};
