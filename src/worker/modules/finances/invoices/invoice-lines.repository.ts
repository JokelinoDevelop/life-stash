import { and, asc, count, eq, inArray } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { financeInvoiceLines } from "../../../db/schema/finances";

export type InvoiceLineRow = typeof financeInvoiceLines.$inferSelect;

export type NewInvoiceLine = Omit<
  typeof financeInvoiceLines.$inferInsert,
  "householdId" | "id" | "invoiceId" | "position"
>;

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

  /** Replaces an invoice's lines with `lines`, in that order. */
  async replace(
    invoiceId: string,
    lines: readonly NewInvoiceLine[]
  ): Promise<void> {
    const remove = this.#db
      .delete(financeInvoiceLines)
      .where(
        and(
          eq(financeInvoiceLines.householdId, this.#householdId),
          eq(financeInvoiceLines.invoiceId, invoiceId)
        )
      );

    if (lines.length === 0) {
      await remove;

      return;
    }

    const insert = this.#db.insert(financeInvoiceLines).values(
      lines.map((line, position) => ({
        ...line,
        householdId: this.#householdId,
        invoiceId,
        position,
      }))
    );

    // One batch, so an invoice never ends up with half its lines.
    await this.#db.batch([remove, insert]);
  }
}

export type InvoiceLinesRepositoryPort = Pick<
  InvoiceLinesRepository,
  "list" | "countByInvoice" | "replace"
>;
