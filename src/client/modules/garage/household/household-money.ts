import type { Currency } from "@shared/domain/money";

import { mainCurrency } from "../spending/main-currency";
import type { HouseholdOverview } from "./household.queries";

export interface HouseholdMoney {
  currency: Currency;
  thisYear: number;
  lastYear: number | null;
  /** Spending per month of this year (index 0 = January) in `currency`. */
  months: number[];
  /** Per car and month, for the stacked chart. */
  carMonths: Map<string, number[]>;
  carTotals: Map<string, number>;
}

const MONTHS_IN_YEAR = 12;

/** Household spending in one currency (the preferred one when used). */
export const householdMoney = (
  overview: HouseholdOverview,
  preferred: Currency
): HouseholdMoney => {
  const currency = mainCurrency(
    [...overview.spentThisYear, ...overview.months],
    preferred
  );

  const months = Array.from({ length: MONTHS_IN_YEAR }, () => 0);
  const carMonths = new Map<string, number[]>();
  const carTotals = new Map<string, number>();

  for (const entry of overview.months) {
    if (entry.currency === currency) {
      const index = Number(entry.month.slice(5, 7)) - 1;
      months[index] = (months[index] ?? 0) + entry.amountMinor;

      const perCar =
        carMonths.get(entry.carId) ??
        Array.from({ length: MONTHS_IN_YEAR }, () => 0);

      perCar[index] = (perCar[index] ?? 0) + entry.amountMinor;
      carMonths.set(entry.carId, perCar);
      carTotals.set(
        entry.carId,
        (carTotals.get(entry.carId) ?? 0) + entry.amountMinor
      );
    }
  }

  const pick = (list: HouseholdOverview["spentThisYear"]) =>
    list.find((entry) => entry.currency === currency)?.amountMinor ?? null;

  return {
    carMonths,
    carTotals,
    currency,
    months,
    lastYear: pick(overview.spentLastYear),
    thisYear: pick(overview.spentThisYear) ?? 0,
  };
};

/** Whole-percent change from last year, or null when there is nothing to compare. */
export const percentChange = (money: HouseholdMoney): number | null =>
  money.lastYear === null || money.lastYear === 0
    ? null
    : Math.round(((money.thisYear - money.lastYear) / money.lastYear) * 100);

/** Series colours for cars in the stacked chart (blue ramp, one accent). */
const CAR_COLORS = [
  "bg-chart-1",
  "bg-chart-3",
  "bg-chart-2",
  "bg-chart-5",
  "bg-chart-4",
] as const;

export const carColor = (index: number): string =>
  CAR_COLORS[index % CAR_COLORS.length] ?? "bg-chart-1";
