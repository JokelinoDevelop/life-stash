import { yearOf } from "./dates";
import type { Currency } from "./money";

export interface VisitCost {
  date: string;
  currency: Currency;
  totalMinor: number | null;
  itemCostsMinor: readonly (number | null)[];
  byPreviousOwner: boolean;
}

/** Invoice total if known, otherwise the sum of known item costs, otherwise null. */
export const effectiveVisitTotal = (visit: VisitCost): number | null => {
  if (visit.totalMinor !== null) {
    return visit.totalMinor;
  }

  const known = visit.itemCostsMinor.filter(
    (cost): cost is number => cost !== null
  );

  return known.length > 0 ? known.reduce((sum, cost) => sum + cost, 0) : null;
};

export interface YearCurrencyTotal {
  year: number;
  currency: Currency;
  amountMinor: number;
}

/** Personal maintenance spending per year and currency; previous-owner work is excluded. */
export const personalSpendingByYear = (
  visits: readonly VisitCost[]
): YearCurrencyTotal[] => {
  const totals = new Map<string, YearCurrencyTotal>();

  for (const visit of visits) {
    const amount = visit.byPreviousOwner ? null : effectiveVisitTotal(visit);

    if (amount !== null) {
      const year = yearOf(visit.date);
      const key = `${year}:${visit.currency}`;

      const current = totals.get(key) ?? {
        amountMinor: 0,
        currency: visit.currency,
        year,
      };

      current.amountMinor += amount;
      totals.set(key, current);
    }
  }

  return [...totals.values()].toSorted(
    (a, b) => b.year - a.year || a.currency.localeCompare(b.currency)
  );
};
