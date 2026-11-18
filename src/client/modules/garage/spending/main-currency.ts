import type { Currency } from "@shared/domain/money";

/** The currency to chart: the preferred one when used, otherwise the most used one. */
export const mainCurrency = (
  rows: readonly { currency: Currency }[],
  preferred: Currency
): Currency => {
  const counts = new Map<Currency, number>();

  for (const row of rows) {
    counts.set(row.currency, (counts.get(row.currency) ?? 0) + 1);
  }

  if (counts.has(preferred) || counts.size === 0) {
    return preferred;
  }

  return (
    [...counts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? preferred
  );
};
