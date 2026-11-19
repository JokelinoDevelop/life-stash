import { invoiceStatus } from "@shared/domain/finances/invoices";
import { toMajor } from "@shared/domain/money";

import { toCsv } from "../../settings/csv";
import type { CategoriesService } from "../categories/categories.service";
import type { ClockPort } from "../household/clock";
import type { InvoicesRepositoryPort } from "../invoices/invoices.repository";
import type { TransactionsRepositoryPort } from "../transactions/transactions.repository";

export type ExportKind = "transactions" | "invoices";

/** One CSV per year, for an accountant or a tax return. Amounts in major units, never converted. */
export class FinanceExportService {
  readonly #transactions: Pick<TransactionsRepositoryPort, "inRange">;
  readonly #invoices: Pick<InvoicesRepositoryPort, "list">;
  readonly #categories: Pick<CategoriesService, "list">;
  readonly #clients: { names: () => Promise<Map<string, string>> };
  readonly #clock: ClockPort;

  constructor(deps: {
    transactions: Pick<TransactionsRepositoryPort, "inRange">;
    invoices: Pick<InvoicesRepositoryPort, "list">;
    categories: Pick<CategoriesService, "list">;
    clients: { names: () => Promise<Map<string, string>> };
    clock: ClockPort;
  }) {
    this.#transactions = deps.transactions;
    this.#invoices = deps.invoices;
    this.#categories = deps.categories;
    this.#clients = deps.clients;
    this.#clock = deps.clock;
  }

  async csv(kind: ExportKind, year: number): Promise<string> {
    return kind === "transactions"
      ? await this.#transactionsCsv(year)
      : await this.#invoicesCsv(year);
  }

  async #transactionsCsv(year: number): Promise<string> {
    const [rows, categories, clients] = await Promise.all([
      this.#transactions.inRange(`${year}-01-01`, `${year}-12-31`),
      this.#categories.list(),
      this.#clients.names(),
    ]);

    const categoryNames = new Map(
      categories.map((category) => [category.id, category.name])
    );

    return toCsv(
      [
        "date",
        "kind",
        "description",
        "category",
        "client",
        "amount",
        "currency",
        "notes",
      ],
      rows
        .toSorted(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.createdAt.localeCompare(b.createdAt)
        )
        .map((row) => [
          row.date,
          row.kind,
          row.description,
          categoryNames.get(row.categoryId) ?? "",
          row.clientId === null ? null : (clients.get(row.clientId) ?? null),
          toMajor(row.amountMinor),
          row.currency,
          row.notes,
        ])
    );
  }

  async #invoicesCsv(year: number): Promise<string> {
    const [rows, today] = await Promise.all([
      this.#invoices.list(),
      this.#clock.today(),
    ]);

    return toCsv(
      [
        "number",
        "client",
        "project",
        "issue_date",
        "due_date",
        "period_start",
        "period_end",
        "description",
        "amount",
        "currency",
        "status",
        "paid_at",
      ],
      rows
        .filter((row) => row.issueDate.startsWith(`${year}-`))
        .toSorted(
          (a, b) =>
            a.issueDate.localeCompare(b.issueDate) ||
            a.number.localeCompare(b.number)
        )
        .map((row) => [
          row.number,
          row.clientName,
          row.projectName,
          row.issueDate,
          row.dueDate,
          row.periodStart,
          row.periodEnd,
          row.description,
          toMajor(row.amountMinor),
          row.currency,
          invoiceStatus(row, today).status,
          row.paidAt,
        ])
    );
  }
}
