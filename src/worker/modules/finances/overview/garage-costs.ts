import { sumByCurrency } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";

import type { Db } from "../../../core/db";
import { householdSpending } from "../../garage/spending/spending.service";

/**
 * Read-only bridge to Garage's spending service (service → service). Car costs are shown on the
 * Finances overview but never copied into the ledger, so nothing is counted twice.
 */
export class GarageCostsReader {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  async forYear(year: number): Promise<MoneyTotal[]> {
    const cars = await householdSpending(this.#db, this.#householdId);
    const costs: MoneyTotal[] = [];

    for (const entry of cars.flatMap((car) => car.years)) {
      if (entry.year === year) {
        costs.push({
          amountMinor:
            entry.maintenanceMinor + entry.repairMinor + entry.otherMinor,
          currency: entry.currency,
        });
      }
    }

    return sumByCurrency(costs);
  }
}

export type GarageCostsPort = Pick<GarageCostsReader, "forYear">;
