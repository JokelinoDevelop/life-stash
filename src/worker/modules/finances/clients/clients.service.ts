import {
  averageDaysToGetPaid,
  invoiceStatus,
} from "@shared/domain/finances/invoices";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import { sumByCurrency } from "@shared/domain/money";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import { domainError, notFound } from "../../../core/errors";
import type { ClockPort } from "../household/clock";
import type {
  InvoicesRepositoryPort,
  InvoiceWithClient,
} from "../invoices/invoices.repository";
import type { LedgerLinksPort } from "../transactions/ledger-links.repository";
import type {
  ClientPatch,
  ClientRow,
  ClientsRepositoryPort,
} from "./clients.repository";

export interface ClientInput {
  name: string;
  kind: "client" | "employer";
  currency: Currency;
  paymentTermsDays: number;
  email: string | null;
  notes: string | null;
}

export interface ClientInvoice extends InvoiceWithClient {
  displayStatus: InvoiceStatus;
  daysOverdue: number;
}

export interface ClientSummary extends ClientRow {
  earnedThisYear: MoneyTotal[];
  unpaid: MoneyTotal[];
  late: MoneyTotal[];
  lastInvoice: {
    number: string;
    status: InvoiceStatus;
    issueDate: string;
  } | null;
  since: string | null;
}

export interface ClientDetail extends ClientSummary {
  earnedAllTime: MoneyTotal[];
  averageDaysToGetPaid: number | null;
  invoices: ClientInvoice[];
  /** Income from this client per month of the year (12 entries), per currency. */
  earnedByMonth: { month: number; totals: MoneyTotal[] }[];
}

const MONTHS = 12;

const summarise = (
  client: ClientRow,
  context: {
    income: { date: string; amountMinor: number; currency: Currency }[];
    invoices: InvoiceWithClient[];
    since: string | null;
    today: string;
    year: number;
  }
): ClientSummary => {
  const sent = context.invoices.filter((invoice) => invoice.status === "sent");

  const [last] = context.invoices;
  const firstInvoice = context.invoices.at(-1)?.issueDate ?? null;

  const candidates = [
    context.since,
    firstInvoice,
    client.createdAt.slice(0, 10),
  ].filter((value): value is string => value !== null);

  return {
    ...client,
    earnedThisYear: sumByCurrency(
      context.income.filter((row) => row.date.startsWith(`${context.year}-`))
    ),
    late: sumByCurrency(
      sent.filter((invoice) => invoice.dueDate < context.today)
    ),
    lastInvoice:
      last === undefined
        ? null
        : {
            issueDate: last.issueDate,
            number: last.number,
            status: invoiceStatus(last, context.today).status,
          },
    since: candidates.toSorted()[0] ?? null,
    unpaid: sumByCurrency(sent),
  };
};

export class ClientsService {
  readonly #repo: ClientsRepositoryPort;
  readonly #invoices: Pick<InvoicesRepositoryPort, "list">;
  readonly #transactions: Pick<LedgerLinksPort, "incomeByClient">;
  readonly #clock: ClockPort;

  constructor(
    repo: ClientsRepositoryPort,
    invoices: Pick<InvoicesRepositoryPort, "list">,
    transactions: Pick<LedgerLinksPort, "incomeByClient">,
    clock: ClockPort
  ) {
    this.#repo = repo;
    this.#invoices = invoices;
    this.#transactions = transactions;
    this.#clock = clock;
  }

  async get(clientId: string): Promise<ClientRow> {
    const row = await this.#repo.findById(clientId);

    if (!row) {
      throw notFound();
    }

    return row;
  }

  /** A client an income entry or invoice may reference (archived ones only when unchanged). */
  async requireForEntry(
    clientId: string,
    keptFrom: string | null = null
  ): Promise<ClientRow> {
    const client = await this.get(clientId);

    if (client.archivedAt !== null && keptFrom !== clientId) {
      throw notFound();
    }

    return client;
  }

  async list(year: number): Promise<ClientSummary[]> {
    const [today, clients, invoices, income, since] = await Promise.all([
      this.#clock.today(),
      this.#repo.list(),
      this.#invoices.list(),
      this.#transactions.incomeByClient(),
      this.#repo.firstIncomeDates(),
    ]);

    return clients.map((client) =>
      summarise(client, {
        income: income.filter((row) => row.clientId === client.id),
        invoices: invoices.filter((invoice) => invoice.clientId === client.id),
        since: since.get(client.id) ?? null,
        today,
        year,
      })
    );
  }

  async detail(clientId: string, year: number): Promise<ClientDetail> {
    const [client, today, invoices, income, since] = await Promise.all([
      this.get(clientId),
      this.#clock.today(),
      this.#invoices.list({ clientId }),
      this.#transactions.incomeByClient(clientId),
      this.#repo.firstIncomeDates(),
    ]);

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    const summary = summarise(client, {
      income,
      invoices,
      since: since.get(clientId) ?? null,
      today,
      year,
    });

    const prefix = `${year}-`;

    return {
      ...summary,
      averageDaysToGetPaid: averageDaysToGetPaid(
        invoices.filter((invoice) => invoice.status === "paid")
      ),
      earnedAllTime: sumByCurrency(income),
      earnedByMonth: Array.from({ length: MONTHS }, (_, index) => {
        const month = `${prefix}${String(index + 1).padStart(2, "0")}`;

        return {
          month: index + 1,
          totals: sumByCurrency(
            income.filter((row) => row.date.startsWith(month))
          ),
        };
      }),
      invoices: invoices.map((invoice) => ({
        ...invoice,
        ...ClientsService.#derived(invoice, today),
      })),
    };
  }

  static #derived(invoice: InvoiceWithClient, today: string) {
    const { status, daysOverdue } = invoiceStatus(invoice, today);

    return { daysOverdue, displayStatus: status };
  }

  async create(input: ClientInput): Promise<ClientRow> {
    await this.#assertNameFree(input.name, null);

    return await this.#repo.insert(input);
  }

  async update(
    clientId: string,
    changes: Partial<ClientInput> & { archived?: boolean }
  ): Promise<void> {
    await this.get(clientId);
    const { archived, ...fields } = changes;

    if (fields.name !== undefined) {
      await this.#assertNameFree(fields.name, clientId);
    }

    const patch: ClientPatch = { ...fields };

    if (archived !== undefined) {
      patch.archivedAt = archived ? this.#clock.now().toISOString() : null;
    }

    await this.#repo.update(clientId, patch);
  }

  /** Deletes a client nothing refers to; one with invoices or income must be archived. */
  async delete(clientId: string): Promise<void> {
    await this.get(clientId);

    if ((await this.#repo.usage(clientId)) > 0) {
      throw domainError("finances.client_in_use");
    }

    await this.#repo.delete(clientId);
  }

  async #assertNameFree(name: string, exceptId: string | null): Promise<void> {
    const existing = await this.#repo.findByName(name.trim());

    if (existing !== undefined && existing.id !== exceptId) {
      throw domainError("finances.client_name_taken", { field: "name" });
    }
  }
}
