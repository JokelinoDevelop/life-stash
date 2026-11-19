import type { CarSpendingYear } from "../spending/spending.queries";

/** A year's total in the year's currency. */
export const yearTotal = (year: CarSpendingYear): number =>
  year.maintenanceMinor + year.repairMinor + year.otherMinor;
