import { and, asc, count, eq, isNull, max, sql } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  financeClients,
  financeInvoices,
  financeTransactions,
} from "../../../db/schema/finances";

export type ClientRow = typeof financeClients.$inferSelect;

export type NewClient = Omit<
  typeof financeClients.$inferInsert,
  "householdId" | "id" | "createdAt" | "updatedAt"
>;

export type ClientPatch = Partial<NewClient>;

/** Household-scoped access to `finance_clients`. */
export class ClientsRepository {
  readonly #db: Db;
  readonly #householdId: string;

  constructor(db: Db, householdId: string) {
    this.#db = db;
    this.#householdId = householdId;
  }

  #byId(clientId: string) {
    return and(
      eq(financeClients.id, clientId),
      eq(financeClients.householdId, this.#householdId)
    );
  }

  async list(): Promise<ClientRow[]> {
    return await this.#db
      .select()
      .from(financeClients)
      .where(eq(financeClients.householdId, this.#householdId))
      .orderBy(asc(financeClients.name));
  }

  async findById(clientId: string): Promise<ClientRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeClients)
      .where(this.#byId(clientId))
      .limit(1);

    return row;
  }

  /** Case-insensitive name lookup, to keep names unique per household. */
  async findByName(name: string): Promise<ClientRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(financeClients)
      .where(
        and(
          eq(financeClients.householdId, this.#householdId),
          sql`lower(${financeClients.name}) = ${name.toLowerCase()}`
        )
      )
      .limit(1);

    return row;
  }

  async insert(values: NewClient): Promise<ClientRow> {
    const [row] = await this.#db
      .insert(financeClients)
      .values({ ...values, householdId: this.#householdId })
      .returning();

    if (!row) {
      throw new Error("Client insert returned no row");
    }

    return row;
  }

  async update(clientId: string, patch: ClientPatch): Promise<void> {
    await this.#db
      .update(financeClients)
      .set(patch)
      .where(this.#byId(clientId));
  }

  async delete(clientId: string): Promise<void> {
    await this.#db.delete(financeClients).where(this.#byId(clientId));
  }

  /** Invoices and transactions referencing the client (including soft-deleted ones). */
  async usage(clientId: string): Promise<number> {
    const [[invoices], [transactions]] = await Promise.all([
      this.#db
        .select({ rows: count() })
        .from(financeInvoices)
        .where(
          and(
            eq(financeInvoices.householdId, this.#householdId),
            eq(financeInvoices.clientId, clientId)
          )
        ),
      this.#db
        .select({ rows: count() })
        .from(financeTransactions)
        .where(
          and(
            eq(financeTransactions.householdId, this.#householdId),
            eq(financeTransactions.clientId, clientId)
          )
        ),
    ]);

    return (invoices?.rows ?? 0) + (transactions?.rows ?? 0);
  }

  /** First income date per client, for "Client since". */
  async firstIncomeDates(): Promise<Map<string, string>> {
    const rows = await this.#db
      .select({
        clientId: financeTransactions.clientId,
        first: sql<string>`min(${financeTransactions.date})`,
      })
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.householdId, this.#householdId),
          isNull(financeTransactions.deletedAt)
        )
      )
      .groupBy(financeTransactions.clientId);

    return new Map(
      rows.flatMap((row) =>
        row.clientId === null ? [] : [[row.clientId, row.first] as const]
      )
    );
  }

  /** Latest invoice issue date per client. */
  async lastInvoiceDates(): Promise<Map<string, string>> {
    const rows = await this.#db
      .select({
        clientId: financeInvoices.clientId,
        last: max(financeInvoices.issueDate),
      })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.householdId, this.#householdId),
          isNull(financeInvoices.deletedAt)
        )
      )
      .groupBy(financeInvoices.clientId);

    return new Map(
      rows.flatMap((row) =>
        row.last === null ? [] : [[row.clientId, row.last] as const]
      )
    );
  }
}

export type ClientsRepositoryPort = Pick<
  ClientsRepository,
  | "list"
  | "findById"
  | "findByName"
  | "insert"
  | "update"
  | "delete"
  | "usage"
  | "firstIncomeDates"
  | "lastInvoiceDates"
>;
