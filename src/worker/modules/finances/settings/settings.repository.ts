import { eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { financeSettings } from "../../../db/schema/finances";

export type FinanceSettingsRow = typeof financeSettings.$inferSelect;

export type FinanceSettingsPatch = Partial<
  Pick<
    FinanceSettingsRow,
    | "defaultPaymentTermsDays"
    | "exchangeRates"
    | "invoiceNumberFormat"
    | "overdueReminders"
  >
>;

/** The household's one `finance_settings` row (absent until first changed). */
export class FinanceSettingsRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  async find(): Promise<FinanceSettingsRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeSettings)
      .where(eq(financeSettings.householdId, this.#householdId))
      .limit(1);

    return row;
  }

  async upsert(patch: FinanceSettingsPatch): Promise<void> {
    await this.#db
      .insert(financeSettings)
      .values({ ...patch, householdId: this.#householdId })
      .onConflictDoUpdate({ set: patch, target: financeSettings.householdId });
  }
}

export type FinanceSettingsRepositoryPort = Pick<
  FinanceSettingsRepository,
  "find" | "upsert"
>;
