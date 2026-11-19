import type { Currency } from "../money";
import { CURRENCIES } from "../money";

export interface BreakdownEntry {
  categoryId: string;
  date: string;
  amountMinor: number;
  currency: Currency;
}

export interface CategoryShare {
  categoryId: string;
  currency: Currency;
  amountMinor: number;
  /** Share of the currency's total in this range, 0–100, rounded to one decimal. */
  sharePercent: number;
}

const PERCENT = 100;
const ONE_DECIMAL = 10;

/**
 * Totals per category within `[from, to]` (inclusive ISO dates), largest first, with each
 * category's share of its currency's total. Mixed currencies stay separate.
 */
export const categoryBreakdown = (
  entries: readonly BreakdownEntry[],
  range: { from: string; to: string }
): CategoryShare[] => {
  const totals = new Map<string, CategoryShare>();
  const currencyTotals = new Map<Currency, number>();

  for (const entry of entries) {
    if (entry.date < range.from || entry.date > range.to) {
      continue;
    }

    const key = `${entry.currency}:${entry.categoryId}`;

    const share = totals.get(key) ?? {
      amountMinor: 0,
      categoryId: entry.categoryId,
      currency: entry.currency,
      sharePercent: 0,
    };

    share.amountMinor += entry.amountMinor;
    totals.set(key, share);
    currencyTotals.set(
      entry.currency,
      (currencyTotals.get(entry.currency) ?? 0) + entry.amountMinor
    );
  }

  return [...totals.values()]
    .map((share) => {
      const total = currencyTotals.get(share.currency) ?? 0;

      return {
        ...share,
        sharePercent:
          total === 0
            ? 0
            : Math.round((share.amountMinor / total) * PERCENT * ONE_DECIMAL) /
              ONE_DECIMAL,
      };
    })
    .toSorted(
      (a, b) =>
        CURRENCIES.indexOf(a.currency) - CURRENCIES.indexOf(b.currency) ||
        b.amountMinor - a.amountMinor ||
        a.categoryId.localeCompare(b.categoryId)
    );
};
