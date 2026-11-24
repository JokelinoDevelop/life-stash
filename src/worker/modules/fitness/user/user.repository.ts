import { and, eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { userPreferences, users } from "../../../db/schema/core";

export interface FitnessUserPreferences {
  locale: "en" | "mk";
  timeZone: string;
  fitnessReminders: boolean;
}

const FALLBACK: FitnessUserPreferences = {
  fitnessReminders: true,
  locale: "en",
  timeZone: "Europe/Skopje",
};

/** The signed-in user's own preferences (Fitness follows the user's calendar, not the household's). */
export class FitnessUserRepository {
  readonly #db: Db;
  readonly #householdId: string;
  readonly #userId: string;

  constructor(db: Db, householdId: string, userId: string) {
    this.#db = db;
    this.#householdId = householdId;
    this.#userId = userId;
  }

  async preferences(): Promise<FitnessUserPreferences> {
    const [row] = await this.#db
      .select({
        fitnessReminders: userPreferences.fitnessReminders,
        locale: userPreferences.locale,
        timeZone: userPreferences.timeZone,
      })
      .from(users)
      .innerJoin(userPreferences, eq(userPreferences.userId, users.id))
      .where(
        and(
          eq(users.id, this.#userId),
          eq(users.householdId, this.#householdId)
        )
      )
      .limit(1);

    return row ?? FALLBACK;
  }

  async setReminders(enabled: boolean): Promise<void> {
    await this.#db
      .update(userPreferences)
      .set({ fitnessReminders: enabled })
      .where(eq(userPreferences.userId, this.#userId));
  }
}

export type FitnessUserPort = Pick<
  FitnessUserRepository,
  "preferences" | "setReminders"
>;
