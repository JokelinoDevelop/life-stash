import { asc, eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { userPreferences, users } from "../../../db/schema/core";

export interface HouseholdPreferences {
  locale: "en" | "mk";
  timeZone: string;
  currency: "MKD" | "EUR" | "USD";
}

const FALLBACK: HouseholdPreferences = {
  currency: "MKD",
  locale: "en",
  timeZone: "Europe/Skopje",
};

/** Reads the household's preferences (from its first member) for defaults like locale and "today". */
export class HouseholdRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  async preferences(): Promise<HouseholdPreferences> {
    const [row] = await this.#db
      .select({
        currency: userPreferences.currency,
        locale: userPreferences.locale,
        timeZone: userPreferences.timeZone,
      })
      .from(users)
      .innerJoin(userPreferences, eq(userPreferences.userId, users.id))
      .where(eq(users.householdId, this.#householdId))
      .orderBy(asc(users.createdAt))
      .limit(1);

    return row ?? FALLBACK;
  }
}
