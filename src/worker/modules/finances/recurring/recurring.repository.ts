import { and, asc, eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  financeCategories,
  financeClients,
  financeRecurring,
} from "../../../db/schema/finances";

export type RecurringRow = typeof financeRecurring.$inferSelect;

export type NewRecurring = Omit<
  typeof financeRecurring.$inferInsert,
  "householdId" | "id" | "createdAt" | "updatedAt"
>;

export interface RecurringWithNames extends RecurringRow {
  categoryName: string;
  categoryIcon: string | null;
  clientName: string | null;
}

/** Household-scoped access to `finance_recurring`. */
export class RecurringRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  #byId(recurringId: string) {
    return and(
      eq(financeRecurring.id, recurringId),
      eq(financeRecurring.householdId, this.#householdId)
    );
  }

  async list(): Promise<RecurringWithNames[]> {
    const rows = await this.#db
      .select({
        categoryIcon: financeCategories.icon,
        categoryName: financeCategories.name,
        clientName: financeClients.name,
        recurring: financeRecurring,
      })
      .from(financeRecurring)
      .innerJoin(
        financeCategories,
        eq(financeCategories.id, financeRecurring.categoryId)
      )
      .leftJoin(
        financeClients,
        eq(financeClients.id, financeRecurring.clientId)
      )
      .where(eq(financeRecurring.householdId, this.#householdId))
      .orderBy(
        asc(financeRecurring.dayOfMonth),
        asc(financeRecurring.description)
      );

    return rows.map((row) => ({
      ...row.recurring,
      categoryIcon: row.categoryIcon,
      categoryName: row.categoryName,
      clientName: row.clientName,
    }));
  }

  async findById(recurringId: string): Promise<RecurringRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeRecurring)
      .where(this.#byId(recurringId))
      .limit(1);

    return row;
  }

  async insert(values: NewRecurring): Promise<RecurringRow> {
    const [row] = await this.#db
      .insert(financeRecurring)
      .values({ ...values, householdId: this.#householdId })
      .returning();

    if (!row) {
      throw new Error("Recurring insert returned no row");
    }

    return row;
  }

  async update(
    recurringId: string,
    patch: Partial<NewRecurring>
  ): Promise<void> {
    await this.#db
      .update(financeRecurring)
      .set(patch)
      .where(this.#byId(recurringId));
  }

  async delete(recurringId: string): Promise<void> {
    await this.#db.delete(financeRecurring).where(this.#byId(recurringId));
  }
}

export type RecurringRepositoryPort = Pick<
  RecurringRepository,
  "list" | "findById" | "insert" | "update" | "delete"
>;
