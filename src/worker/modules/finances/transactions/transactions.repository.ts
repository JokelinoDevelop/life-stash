import type { TransactionKind } from "@shared/domain/finances/kinds";
import type { Currency } from "@shared/domain/money";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  financeCategories,
  financeClients,
  financeInvoices,
  financeTransactions,
} from "../../../db/schema/finances";

export type TransactionRow = typeof financeTransactions.$inferSelect;

export type NewTransaction = Omit<
  typeof financeTransactions.$inferInsert,
  "householdId" | "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type TransactionPatch = Partial<NewTransaction>;

export interface TransactionFilter {
  from: string | null;
  to: string | null;
  kind: TransactionKind | null;
  categoryId: string | null;
  clientId: string | null;
  q: string | null;
}

/** Position after the last row of a page (newest first). */
export interface TransactionCursor {
  date: string;
  createdAt: string;
  id: string;
}

export interface TransactionListRow extends TransactionRow {
  category: {
    id: string;
    name: string;
    icon: string | null;
    systemKey: "invoices" | null;
  };
  client: { id: string; name: string } | null;
  invoice: { id: string; number: string } | null;
}

export interface MonthTotalRow {
  month: string;
  kind: TransactionKind;
  currency: Currency;
  amountMinor: number;
  entries: number;
}

/** Household-scoped access to `finance_transactions` (soft-deleted rows are hidden). */
export class TransactionsRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  #scope(): SQL {
    return sql`${financeTransactions.householdId} = ${this.#householdId} and ${financeTransactions.deletedAt} is null`;
  }

  #filters(filter: TransactionFilter): SQL[] {
    const filters: SQL[] = [this.#scope()];

    if (filter.from !== null) {
      filters.push(gte(financeTransactions.date, filter.from));
    }

    if (filter.to !== null) {
      filters.push(lte(financeTransactions.date, filter.to));
    }

    if (filter.kind !== null) {
      filters.push(eq(financeTransactions.kind, filter.kind));
    }

    if (filter.categoryId !== null) {
      filters.push(eq(financeTransactions.categoryId, filter.categoryId));
    }

    if (filter.clientId !== null) {
      filters.push(eq(financeTransactions.clientId, filter.clientId));
    }

    if (filter.q !== null) {
      const pattern = `%${filter.q.toLowerCase()}%`;

      const text = or(
        sql`lower(${financeTransactions.description}) like ${pattern}`,
        sql`lower(coalesce(${financeTransactions.notes}, '')) like ${pattern}`
      );

      if (text) {
        filters.push(text);
      }
    }

    return filters;
  }

  async page(
    filter: TransactionFilter,
    cursor: TransactionCursor | null,
    limit: number
  ): Promise<TransactionListRow[]> {
    const filters = this.#filters(filter);

    if (cursor !== null) {
      const after = or(
        lt(financeTransactions.date, cursor.date),
        and(
          eq(financeTransactions.date, cursor.date),
          lt(financeTransactions.createdAt, cursor.createdAt)
        ),
        and(
          eq(financeTransactions.date, cursor.date),
          eq(financeTransactions.createdAt, cursor.createdAt),
          lt(financeTransactions.id, cursor.id)
        )
      );

      if (after) {
        filters.push(after);
      }
    }

    const rows = await this.#db
      .select({
        category: {
          icon: financeCategories.icon,
          id: financeCategories.id,
          name: financeCategories.name,
          systemKey: financeCategories.systemKey,
        },
        clientName: financeClients.name,
        invoiceNumber: financeInvoices.number,
        transaction: financeTransactions,
      })
      .from(financeTransactions)
      .innerJoin(
        financeCategories,
        eq(financeCategories.id, financeTransactions.categoryId)
      )
      .leftJoin(
        financeClients,
        eq(financeClients.id, financeTransactions.clientId)
      )
      .leftJoin(
        financeInvoices,
        eq(financeInvoices.id, financeTransactions.invoiceId)
      )
      .where(and(...filters))
      .orderBy(
        desc(financeTransactions.date),
        desc(financeTransactions.createdAt),
        desc(financeTransactions.id)
      )
      .limit(limit);

    return rows.map((row) => ({
      ...row.transaction,
      category: row.category,
      client:
        row.transaction.clientId === null || row.clientName === null
          ? null
          : { id: row.transaction.clientId, name: row.clientName },
      invoice:
        row.transaction.invoiceId === null || row.invoiceNumber === null
          ? null
          : { id: row.transaction.invoiceId, number: row.invoiceNumber },
    }));
  }

  /** Totals per month, kind and currency for the whole filtered set (not just one page). */
  async monthTotals(filter: TransactionFilter): Promise<MonthTotalRow[]> {
    const month = sql<string>`substr(${financeTransactions.date}, 1, 7)`;

    return await this.#db
      .select({
        amountMinor: sum(financeTransactions.amountMinor).mapWith(Number),
        currency: financeTransactions.currency,
        entries: count(),
        kind: financeTransactions.kind,
        month,
      })
      .from(financeTransactions)
      .where(and(...this.#filters(filter)))
      .groupBy(month, financeTransactions.kind, financeTransactions.currency);
  }

  /** Every live transaction in a date range, for reports. */
  async inRange(from: string, to: string): Promise<TransactionRow[]> {
    return await this.#db
      .select()
      .from(financeTransactions)
      .where(
        and(
          this.#scope(),
          gte(financeTransactions.date, from),
          lte(financeTransactions.date, to)
        )
      );
  }

  async findById(
    transactionId: string,
    { includeDeleted = false }: { includeDeleted?: boolean } = {}
  ): Promise<TransactionRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.id, transactionId),
          includeDeleted
            ? eq(financeTransactions.householdId, this.#householdId)
            : this.#scope()
        )
      )
      .limit(1);

    return row;
  }

  /** The newest live entries, for the overview. */
  async recent(limit: number): Promise<TransactionListRow[]> {
    return await this.page(
      {
        categoryId: null,
        clientId: null,
        from: null,
        kind: null,
        q: null,
        to: null,
      },
      null,
      limit
    );
  }

  async insert(values: NewTransaction): Promise<TransactionRow> {
    const [row] = await this.#db
      .insert(financeTransactions)
      .values({ ...values, householdId: this.#householdId })
      .returning();

    if (!row) {
      throw new Error("Transaction insert returned no row");
    }

    return row;
  }

  async update(transactionId: string, patch: TransactionPatch): Promise<void> {
    await this.#db
      .update(financeTransactions)
      .set(patch)
      .where(and(eq(financeTransactions.id, transactionId), this.#scope()));
  }

  async setDeleted(
    transactionId: string,
    deletedAt: string | null
  ): Promise<void> {
    await this.#db
      .update(financeTransactions)
      .set({ deletedAt })
      .where(
        and(
          eq(financeTransactions.id, transactionId),
          eq(financeTransactions.householdId, this.#householdId)
        )
      );
  }

  /** Ids of rows deleted before `cutoff`, for the purge. */
  async deletedBefore(cutoff: string): Promise<string[]> {
    const rows = await this.#db
      .select({ id: financeTransactions.id })
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.householdId, this.#householdId),
          isNotNull(financeTransactions.deletedAt),
          lt(financeTransactions.deletedAt, cutoff)
        )
      );

    return rows.map((row) => row.id);
  }

  async purge(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.#db
      .delete(financeTransactions)
      .where(
        and(
          eq(financeTransactions.householdId, this.#householdId),
          inArray(financeTransactions.id, [...ids])
        )
      );
  }
}

export type TransactionsRepositoryPort = Pick<
  TransactionsRepository,
  | "page"
  | "monthTotals"
  | "inRange"
  | "findById"
  | "recent"
  | "insert"
  | "update"
  | "setDeleted"
  | "deletedBefore"
  | "purge"
>;
