import type { TransactionKind } from "@shared/domain/finances/kinds";
import { and, asc, count, eq, isNull, sql } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  financeCategories,
  financeRecurring,
  financeTransactions,
} from "../../../db/schema/finances";

export type CategoryRow = typeof financeCategories.$inferSelect;

export type NewCategory = Omit<
  typeof financeCategories.$inferInsert,
  "householdId" | "id" | "createdAt"
>;

export type CategoryPatch = Partial<
  Pick<CategoryRow, "name" | "icon" | "archivedAt" | "position">
>;

/** Household-scoped access to `finance_categories`. */
export class CategoriesRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  async list(): Promise<CategoryRow[]> {
    return await this.#db
      .select()
      .from(financeCategories)
      .where(eq(financeCategories.householdId, this.#householdId))
      .orderBy(asc(financeCategories.position), asc(financeCategories.name));
  }

  async find(categoryId: string): Promise<CategoryRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeCategories)
      .where(
        and(
          eq(financeCategories.id, categoryId),
          eq(financeCategories.householdId, this.#householdId)
        )
      )
      .limit(1);

    return row;
  }

  async findBySystemKey(key: "invoices"): Promise<CategoryRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeCategories)
      .where(
        and(
          eq(financeCategories.systemKey, key),
          eq(financeCategories.householdId, this.#householdId)
        )
      )
      .limit(1);

    return row;
  }

  async insertMany(rows: readonly NewCategory[]): Promise<CategoryRow[]> {
    if (rows.length === 0) {
      return [];
    }

    return await this.#db
      .insert(financeCategories)
      .values(rows.map((row) => ({ ...row, householdId: this.#householdId })))
      .returning();
  }

  async update(categoryId: string, patch: CategoryPatch): Promise<void> {
    await this.#db
      .update(financeCategories)
      .set(patch)
      .where(
        and(
          eq(financeCategories.id, categoryId),
          eq(financeCategories.householdId, this.#householdId)
        )
      );
  }

  /** Rewrites positions of one kind in the given order (ids not listed keep theirs). */
  async setPositions(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const [first, ...rest] = ids.map((categoryId, position) =>
      this.#db
        .update(financeCategories)
        .set({ position })
        .where(
          and(
            eq(financeCategories.id, categoryId),
            eq(financeCategories.householdId, this.#householdId)
          )
        )
    );

    if (first) {
      await this.#db.batch([first, ...rest]);
    }
  }

  async delete(categoryId: string): Promise<void> {
    await this.#db
      .delete(financeCategories)
      .where(
        and(
          eq(financeCategories.id, categoryId),
          eq(financeCategories.householdId, this.#householdId)
        )
      );
  }

  /** Entries per category (soft-deleted ones still reference it), plus recurring templates. */
  async usage(): Promise<Map<string, number>> {
    const [entries, templates] = await Promise.all([
      this.#db
        .select({ categoryId: financeTransactions.categoryId, rows: count() })
        .from(financeTransactions)
        .where(eq(financeTransactions.householdId, this.#householdId))
        .groupBy(financeTransactions.categoryId),
      this.#db
        .select({ categoryId: financeRecurring.categoryId, rows: count() })
        .from(financeRecurring)
        .where(eq(financeRecurring.householdId, this.#householdId))
        .groupBy(financeRecurring.categoryId),
    ]);

    const usage = new Map<string, number>();

    for (const row of [...entries, ...templates]) {
      usage.set(row.categoryId, (usage.get(row.categoryId) ?? 0) + row.rows);
    }

    return usage;
  }

  /** Live entries in the last `days`, per category, to rank "Frequent" shortcuts. */
  async recentUsage(sinceDate: string): Promise<Map<string, number>> {
    const rows = await this.#db
      .select({
        categoryId: financeTransactions.categoryId,
        entries: count(),
      })
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.householdId, this.#householdId),
          isNull(financeTransactions.deletedAt),
          sql`${financeTransactions.date} >= ${sinceDate}`
        )
      )
      .groupBy(financeTransactions.categoryId);

    return new Map(rows.map((row) => [row.categoryId, row.entries]));
  }

  async maxPosition(kind: TransactionKind): Promise<number> {
    const [row] = await this.#db
      .select({ max: sql<number | null>`max(${financeCategories.position})` })
      .from(financeCategories)
      .where(
        and(
          eq(financeCategories.householdId, this.#householdId),
          eq(financeCategories.kind, kind)
        )
      );

    return row?.max ?? -1;
  }
}

export type CategoriesRepositoryPort = Pick<
  CategoriesRepository,
  | "list"
  | "find"
  | "findBySystemKey"
  | "insertMany"
  | "update"
  | "setPositions"
  | "delete"
  | "usage"
  | "recentUsage"
  | "maxPosition"
>;
