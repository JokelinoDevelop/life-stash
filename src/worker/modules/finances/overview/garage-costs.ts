import { spendingEntries } from "@shared/domain/spending-report";
import type { DatedCost } from "@shared/domain/spending-report";

import type { Db } from "../../../core/db";
import { loadSources } from "../../garage/spending/spending.service";

/**
 * Read-only bridge to Garage's spending sources (service → service). Car costs are shown on the
 * Finances overview but never copied into the ledger, so nothing is counted twice.
 */
export class GarageCostsReader {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  /** Every car cost of the household with its date, for any range the overview asks for. */
  async entries(): Promise<DatedCost[]> {
    const { visits, expenses } = await loadSources(
      this.#db,
      this.#householdId,
      null
    );

    return spendingEntries(visits, expenses);
  }
}

export type GarageCostsPort = Pick<GarageCostsReader, "entries">;
