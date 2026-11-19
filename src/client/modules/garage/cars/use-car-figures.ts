import { distancePerYear } from "@shared/domain/mileage";
import type { OdometerPoint } from "@shared/domain/mileage";
import { averagePerMonth } from "@shared/domain/mileage-buckets";
import { kmToDisplay } from "@shared/domain/units";

import { useFormat } from "@/lib/format";

import { mainCurrency } from "../spending/main-currency";
import type { CarSpendingYear } from "../spending/spending.queries";
import { yearTotal } from "./spending-total";

export interface CarFigures {
  kmThisYear: number;
  /** "≈ 750 km", or null without enough readings. */
  averagePerMonth: string | null;
  /** This year's spending in the main currency. */
  thisYear: CarSpendingYear | undefined;
  /** This year's spending per distance unit driven this year. */
  costPerDistance: string | null;
}

/** Distance and cost figures for a car's overview, formatted for display. */
export const useCarFigures = (
  points: readonly OdometerPoint[],
  years: readonly CarSpendingYear[],
  year: number
): CarFigures => {
  const format = useFormat();

  const kmThisYear =
    distancePerYear(points).find((entry) => entry.year === year)?.km ?? 0;

  const average = averagePerMonth(points);

  const currency = mainCurrency(
    years.filter((entry) => entry.year === year),
    format.currency
  );

  const thisYear = years.find(
    (entry) => entry.year === year && entry.currency === currency
  );

  const distance = kmToDisplay(kmThisYear, format.unit);

  return {
    averagePerMonth: average === null ? null : `≈ ${format.distance(average)}`,
    costPerDistance:
      thisYear === undefined || distance === 0
        ? null
        : format.money(Math.round(yearTotal(thisYear) / distance), currency),
    kmThisYear,
    thisYear,
  };
};
