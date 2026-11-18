export const CURRENCIES = ["MKD", "EUR", "USD"] as const;

export type Currency = (typeof CURRENCIES)[number];

const MINOR_PER_MAJOR = 100;

/** Converts a major amount (e.g. 1250.50) to integer minor units (125050). */
export const toMinor = (major: number): number =>
  Math.round(major * MINOR_PER_MAJOR);

/** Converts integer minor units back to a major amount. */
export const toMajor = (minor: number): number => minor / MINOR_PER_MAJOR;

export interface MoneyTotal {
  currency: Currency;
  amountMinor: number;
}

/** Sums amounts per currency without converting between currencies. */
export const sumByCurrency = (
  entries: readonly { currency: Currency; amountMinor: number }[]
): MoneyTotal[] => {
  const totals = new Map<Currency, number>();

  for (const entry of entries) {
    totals.set(
      entry.currency,
      (totals.get(entry.currency) ?? 0) + entry.amountMinor
    );
  }

  return [...totals.entries()]
    .map(([currency, amountMinor]) => ({ amountMinor, currency }))
    .toSorted(
      (a, b) => CURRENCIES.indexOf(a.currency) - CURRENCIES.indexOf(b.currency)
    );
};
