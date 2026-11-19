import type { Currency, MoneyTotal } from "@shared/domain/money";

/** The main-currency figure (or the first one) and the rest, for "€X + ден Y" layouts. */
export interface SplitTotals {
  primary: MoneyTotal | null;
  others: MoneyTotal[];
}

export const splitTotals = (
  totals: readonly MoneyTotal[],
  main: Currency
): SplitTotals => {
  const primary =
    totals.find((total) => total.currency === main) ?? totals[0] ?? null;

  return { others: totals.filter((total) => total !== primary), primary };
};

/** Per-currency difference `a − b`. */
export const subtractTotals = (
  a: readonly MoneyTotal[],
  b: readonly MoneyTotal[]
): MoneyTotal[] => {
  const result = new Map<Currency, number>();

  for (const total of a) {
    result.set(
      total.currency,
      (result.get(total.currency) ?? 0) + total.amountMinor
    );
  }

  for (const total of b) {
    result.set(
      total.currency,
      (result.get(total.currency) ?? 0) - total.amountMinor
    );
  }

  return [...result.entries()].map(([currency, amountMinor]) => ({
    amountMinor,
    currency,
  }));
};

/** Percent change from `before` to `after` in one currency; null without a base. */
export const percentChange = (after: number, before: number): number | null =>
  before <= 0 ? null : Math.round(((after - before) / before) * 100);
