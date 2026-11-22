import { and, asc, count, eq, inArray } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { financeInvoiceLines } from "../../../db/schema/finances";

export type InvoiceLineRow = typeof financeInvoiceLines.$inferSelect;

export type NewInvoiceLine = Omit<
  typeof financeInvoiceLines.$inferInsert,
  "householdId" | "id" | "invoiceId" | "position"
>;

/** D1 binds at most 100 values per statement; a line row binds 11. */
const D1_MAX_BOUND_VALUES = 100;
const LINE_COLUMNS = 11;
const LINES_PER_STATEMENT = Math.floor(D1_MAX_BOUND_VALUES / LINE_COLUMNS);

/**
 * The statements that replace an invoice's lines with `lines` (in that order): a delete, then
 * inserts of a few rows each so no statement passes D1's bound-value limit. Run them in the
 * same `db.batch` as the invoice write, so the amount and the lines never disagree.
 */
export const replaceLinesStatements = (
  db: Db,
  householdId: string,
  invoiceId: string,
  lines: readonly NewInvoiceLine[]
) => {
  const remove = db
    .delete(financeInvoiceLines)
    .where(
      and(
        eq(financeInvoiceLines.householdId, householdId),
        eq(financeInvoiceLines.invoiceId, invoiceId)
      )
    );

  const rows = lines.map((line, position) => ({
    ...line,
    householdId,
    invoiceId,
    position,
  }));

  const inserts = Array.from(
    { length: Math.ceil(rows.length / LINES_PER_STATEMENT) },
    (_, index) =>
      db
        .insert(financeInvoiceLines)
        .values(
          rows.slice(
            index * LINES_PER_STATEMENT,
            (index + 1) * LINES_PER_STATEMENT
          )
        )
  );

  return [remove, ...inserts] as const;
};

/** Household-scoped access to `finance_invoice_lines`. */
export class InvoiceLinesRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  /** An invoice's lines in order. */
  async list(invoiceId: string): Promise<InvoiceLineRow[]> {
    return await this.#db
      .select()
      .from(financeInvoiceLines)
      .where(
        and(
          eq(financeInvoiceLines.householdId, this.#householdId),
          eq(financeInvoiceLines.invoiceId, invoiceId)
        )
      )
      .orderBy(asc(financeInvoiceLines.position));
  }

  /** How many lines each invoice has (itemised when above zero). */
  async countByInvoice(
    invoiceIds: readonly string[]
  ): Promise<Map<string, number>> {
    if (invoiceIds.length === 0) {
      return new Map();
    }

    const rows = await this.#db
      .select({ invoiceId: financeInvoiceLines.invoiceId, lines: count() })
      .from(financeInvoiceLines)
      .where(
        and(
          eq(financeInvoiceLines.householdId, this.#householdId),
          inArray(financeInvoiceLines.invoiceId, [...invoiceIds])
        )
      )
      .groupBy(financeInvoiceLines.invoiceId);

    return new Map(rows.map((row) => [row.invoiceId, row.lines]));
  }
}

export type InvoiceLinesRepositoryPort = Pick<
  InvoiceLinesRepository,
  "list" | "countByInvoice"
>;
