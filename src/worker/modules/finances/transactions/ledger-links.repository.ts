import { and, eq, isNotNull, isNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { financeTransactions } from "../../../db/schema/finances";
import type { NewTransaction, TransactionRow } from "./transactions.repository";

/**
 * Ledger entries seen from invoices and clients: the income "mark paid" books (linked by
 * `invoice_id`) and income per client. Household-scoped like every repository.
 */
export class LedgerLinksRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  #live() {
    return and(
      eq(financeTransactions.householdId, this.#householdId),
      isNull(financeTransactions.deletedAt)
    );
  }

  async insertForInvoice(values: NewTransaction): Promise<TransactionRow> {
    const [row] = await this.#db
      .insert(financeTransactions)
      .values({ ...values, householdId: this.#householdId })
      .returning();

    if (!row) {
      throw new Error("Transaction insert returned no row");
    }

    return row;
  }

  /** The live income entry "mark paid" created for an invoice. */
  async findByInvoice(invoiceId: string): Promise<TransactionRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeTransactions)
      .where(and(this.#live(), eq(financeTransactions.invoiceId, invoiceId)))
      .limit(1);

    return row;
  }

  /** Soft-deletes or restores the entry linked to an invoice (with the invoice's delete/undo). */
  async setDeletedByInvoice(
    invoiceId: string,
    deletedAt: string | null
  ): Promise<void> {
    await this.#db
      .update(financeTransactions)
      .set({ deletedAt })
      .where(
        and(
          eq(financeTransactions.householdId, this.#householdId),
          eq(financeTransactions.invoiceId, invoiceId)
        )
      );
  }

  /** Permanently removes the entry linked to an invoice ("mark unpaid"). */
  async deleteByInvoice(invoiceId: string): Promise<void> {
    await this.#db
      .delete(financeTransactions)
      .where(
        and(
          eq(financeTransactions.householdId, this.#householdId),
          eq(financeTransactions.invoiceId, invoiceId)
        )
      );
  }

  /** Live income per client (for client totals and charts). */
  async incomeByClient(
    clientId: string | null = null
  ): Promise<TransactionRow[]> {
    return await this.#db
      .select()
      .from(financeTransactions)
      .where(
        and(
          this.#live(),
          eq(financeTransactions.kind, "income"),
          clientId === null
            ? isNotNull(financeTransactions.clientId)
            : eq(financeTransactions.clientId, clientId)
        )
      );
  }
}

export type LedgerLinksPort = Pick<
  LedgerLinksRepository,
  | "insertForInvoice"
  | "findByInvoice"
  | "setDeletedByInvoice"
  | "deleteByInvoice"
  | "incomeByClient"
>;
