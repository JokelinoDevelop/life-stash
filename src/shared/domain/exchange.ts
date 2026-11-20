import { CURRENCIES } from "./money";
import type { Currency, MoneyTotal } from "./money";

/**
 * Hand-entered exchange rates: how many `base` units one unit of each other
 * currency is worth ("1 EUR = 61.5 MKD" → `{ base: "MKD", rates: { EUR: 61.5 } }`).
 * There is no live feed; MKD is pegged to the euro, so a fixed rate is accurate.
 */
export interface ExchangeRates {
  base: Currency;
  rates: Partial<Record<Currency, number>>;
}

export const NO_RATES: ExchangeRates = { base: "MKD", rates: {} };

/** Units of `rates.base` one unit of `currency` is worth; null when unknown. */
const valueInBase = (
  currency: Currency,
  table: ExchangeRates
): number | null => {
  if (currency === table.base) {
    return 1;
  }

  const rate = table.rates[currency];

  return rate === undefined || rate <= 0 ? null : rate;
};

/** Converts minor units between currencies; null when a rate is missing. */
export const convertMinor = (
  amountMinor: number,
  from: Currency,
  to: Currency,
  table: ExchangeRates
): number | null => {
  if (from === to) {
    return amountMinor;
  }

  const fromValue = valueInBase(from, table);
  const toValue = valueInBase(to, table);

  if (fromValue === null || toValue === null) {
    return null;
  }

  return Math.round((amountMinor * fromValue) / toValue);
};

/**
 * Per-currency totals as one amount in `main`. Null when any currency in the
 * totals has no rate, so callers fall back to showing each currency.
 */
export const totalInCurrency = (
  totals: readonly MoneyTotal[],
  main: Currency,
  table: ExchangeRates
): number | null => {
  let sum = 0;

  for (const total of totals) {
    const converted = convertMinor(
      total.amountMinor,
      total.currency,
      main,
      table
    );

    if (converted === null) {
      return null;
    }

    sum += converted;
  }

  return sum;
};

/** Currencies the user needs a rate for, given their main currency. */
export const currenciesNeedingRates = (main: Currency): Currency[] =>
  CURRENCIES.filter((currency) => currency !== main);
