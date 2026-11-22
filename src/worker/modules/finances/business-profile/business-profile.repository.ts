import { eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { financeBusinessProfile } from "../../../db/schema/finances";

export type BusinessProfileRow = typeof financeBusinessProfile.$inferSelect;

export type BusinessProfileValues = Omit<
  typeof financeBusinessProfile.$inferInsert,
  "householdId" | "updatedAt"
>;

/** The household's one `finance_business_profile` row (absent until first saved). */
export class BusinessProfileRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  async find(): Promise<BusinessProfileRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeBusinessProfile)
      .where(eq(financeBusinessProfile.householdId, this.#householdId))
      .limit(1);

    return row;
  }

  async upsert(values: BusinessProfileValues): Promise<void> {
    await this.#db
      .insert(financeBusinessProfile)
      .values({ ...values, householdId: this.#householdId })
      .onConflictDoUpdate({
        set: { ...values, updatedAt: new Date().toISOString() },
        target: financeBusinessProfile.householdId,
      });
  }
}

export type BusinessProfileRepositoryPort = Pick<
  BusinessProfileRepository,
  "find" | "upsert"
>;
