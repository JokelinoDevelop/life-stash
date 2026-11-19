import { and, desc, eq, inArray, isNotNull, isNull, lt, ne } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  financeClients,
  financeInvoices,
  financeProjects,
} from "../../../db/schema/finances";

export type InvoiceRow = typeof financeInvoices.$inferSelect;

export type NewInvoice = Omit<
  typeof financeInvoices.$inferInsert,
  "householdId" | "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type InvoicePatch = Partial<NewInvoice>;

export interface InvoiceWithClient extends InvoiceRow {
  clientName: string;
  projectName: string | null;
}

/** Household-scoped access to `finance_invoices` (soft-deleted rows hidden unless asked). */
export class InvoicesRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  #live() {
    return and(
      eq(financeInvoices.householdId, this.#householdId),
      isNull(financeInvoices.deletedAt)
    );
  }

  /** Every live invoice with its client's name, newest issue first. */
  async list(filter: { clientId?: string } = {}): Promise<InvoiceWithClient[]> {
    const rows = await this.#db
      .select({
        clientName: financeClients.name,
        invoice: financeInvoices,
        projectName: financeProjects.name,
      })
      .from(financeInvoices)
      .innerJoin(
        financeClients,
        eq(financeClients.id, financeInvoices.clientId)
      )
      .leftJoin(
        financeProjects,
        eq(financeProjects.id, financeInvoices.projectId)
      )
      .where(
        filter.clientId === undefined
          ? this.#live()
          : and(this.#live(), eq(financeInvoices.clientId, filter.clientId))
      )
      .orderBy(desc(financeInvoices.issueDate), desc(financeInvoices.number));

    return rows.map((row) => ({
      ...row.invoice,
      clientName: row.clientName,
      projectName: row.projectName,
    }));
  }

  async findById(
    invoiceId: string,
    { includeDeleted = false }: { includeDeleted?: boolean } = {}
  ): Promise<InvoiceWithClient | undefined> {
    const scope = includeDeleted
      ? eq(financeInvoices.householdId, this.#householdId)
      : this.#live();

    const [row] = await this.#db
      .select({
        clientName: financeClients.name,
        invoice: financeInvoices,
        projectName: financeProjects.name,
      })
      .from(financeInvoices)
      .innerJoin(
        financeClients,
        eq(financeClients.id, financeInvoices.clientId)
      )
      .leftJoin(
        financeProjects,
        eq(financeProjects.id, financeInvoices.projectId)
      )
      .where(and(eq(financeInvoices.id, invoiceId), scope))
      .limit(1);

    return row === undefined
      ? undefined
      : {
          ...row.invoice,
          clientName: row.clientName,
          projectName: row.projectName,
        };
  }

  async numbers(): Promise<string[]> {
    const rows = await this.#db
      .select({ number: financeInvoices.number })
      .from(financeInvoices)
      .where(this.#live());

    return rows.map((row) => row.number);
  }

  /** Whether another live invoice already uses `number`. */
  async numberTaken(number: string, exceptId: string | null): Promise<boolean> {
    const [row] = await this.#db
      .select({ id: financeInvoices.id })
      .from(financeInvoices)
      .where(
        and(
          this.#live(),
          eq(financeInvoices.number, number),
          exceptId === null ? undefined : ne(financeInvoices.id, exceptId)
        )
      )
      .limit(1);

    return row !== undefined;
  }

  async insert(values: NewInvoice): Promise<InvoiceRow> {
    const [row] = await this.#db
      .insert(financeInvoices)
      .values({ ...values, householdId: this.#householdId })
      .returning();

    if (!row) {
      throw new Error("Invoice insert returned no row");
    }

    return row;
  }

  async update(invoiceId: string, patch: InvoicePatch): Promise<void> {
    await this.#db
      .update(financeInvoices)
      .set(patch)
      .where(and(eq(financeInvoices.id, invoiceId), this.#live()));
  }

  /** Records the overdue heads-up (the cron sends one per invoice). */
  async markNotified(invoiceIds: readonly string[], at: string): Promise<void> {
    if (invoiceIds.length === 0) {
      return;
    }

    await this.#db
      .update(financeInvoices)
      .set({ overdueNotifiedAt: at })
      .where(
        and(
          eq(financeInvoices.householdId, this.#householdId),
          inArray(financeInvoices.id, [...invoiceIds])
        )
      );
  }

  async setDeleted(invoiceId: string, deletedAt: string | null): Promise<void> {
    await this.#db
      .update(financeInvoices)
      .set({ deletedAt })
      .where(
        and(
          eq(financeInvoices.id, invoiceId),
          eq(financeInvoices.householdId, this.#householdId)
        )
      );
  }

  async deletedBefore(cutoff: string): Promise<string[]> {
    const rows = await this.#db
      .select({ id: financeInvoices.id })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.householdId, this.#householdId),
          isNotNull(financeInvoices.deletedAt),
          lt(financeInvoices.deletedAt, cutoff)
        )
      );

    return rows.map((row) => row.id);
  }

  async purge(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.#db
      .delete(financeInvoices)
      .where(
        and(
          eq(financeInvoices.householdId, this.#householdId),
          inArray(financeInvoices.id, [...ids])
        )
      );
  }
}

export type InvoicesRepositoryPort = Pick<
  InvoicesRepository,
  | "list"
  | "findById"
  | "numbers"
  | "numberTaken"
  | "insert"
  | "update"
  | "setDeleted"
  | "markNotified"
  | "deletedBefore"
  | "purge"
>;
