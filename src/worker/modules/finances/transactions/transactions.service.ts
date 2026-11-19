import type { TransactionKind } from "@shared/domain/finances/kinds";
import type { Currency } from "@shared/domain/money";

import { domainError, notFound } from "../../../core/errors";
import type { AttachmentsRepositoryPort } from "../attachments/attachments.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { ClientsService } from "../clients/clients.service";
import type {
  MonthTotalRow,
  TransactionCursor,
  TransactionFilter,
  TransactionListRow,
  TransactionPatch,
  TransactionRow,
  TransactionsRepositoryPort,
} from "./transactions.repository";

export const TRANSACTIONS_PAGE_SIZE = 25;

/** Soft-deleted transactions are purged (with their files) after this many days. */
export const UNDO_WINDOW_DAYS = 7;

export interface TransactionInput {
  kind: TransactionKind;
  date: string;
  amountMinor: number;
  currency: Currency;
  categoryId: string;
  /** Who paid; only kept on income. */
  clientId: string | null;
  description: string;
  notes: string | null;
}

export interface TransactionPageRow extends TransactionListRow {
  attachments: number;
}

export interface TransactionPage {
  rows: TransactionPageRow[];
  nextCursor: TransactionCursor | null;
  total: number;
  months: MonthTotalRow[];
}

const MS_PER_DAY = 86_400_000;

export class TransactionsService {
  readonly #repo: TransactionsRepositoryPort;
  readonly #categories: Pick<CategoriesService, "requireForEntry">;
  readonly #clients: Pick<ClientsService, "requireForEntry">;
  readonly #attachments: Pick<AttachmentsRepositoryPort, "countByOwner">;
  readonly #now: () => Date;

  constructor(deps: {
    repo: TransactionsRepositoryPort;
    categories: Pick<CategoriesService, "requireForEntry">;
    clients: Pick<ClientsService, "requireForEntry">;
    attachments: Pick<AttachmentsRepositoryPort, "countByOwner">;
    now?: () => Date;
  }) {
    this.#repo = deps.repo;
    this.#categories = deps.categories;
    this.#clients = deps.clients;
    this.#attachments = deps.attachments;
    this.#now = deps.now ?? (() => new Date());
  }

  async list(
    filter: TransactionFilter,
    cursor: TransactionCursor | null,
    limit = TRANSACTIONS_PAGE_SIZE
  ): Promise<TransactionPage> {
    // One extra row tells whether another page follows.
    const [rows, monthRows] = await Promise.all([
      this.#repo.page(filter, cursor, limit + 1),
      cursor === null ? this.#repo.monthTotals(filter) : Promise.resolve([]),
    ]);

    const count =
      cursor === null
        ? monthRows.reduce((total, row) => total + row.entries, 0)
        : -1;

    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);

    const counts = await this.#attachments.countByOwner(
      "finance_transaction",
      pageRows.map((row) => row.id)
    );

    return {
      months: monthRows,
      nextCursor:
        rows.length > limit && last !== undefined
          ? { createdAt: last.createdAt, date: last.date, id: last.id }
          : null,
      rows: pageRows.map((row) => ({
        ...row,
        attachments: counts.get(row.id) ?? 0,
      })),
      total: count,
    };
  }

  async get(transactionId: string): Promise<TransactionRow> {
    const row = await this.#repo.findById(transactionId);

    if (!row) {
      throw notFound();
    }

    return row;
  }

  async create(input: TransactionInput): Promise<TransactionRow> {
    await this.#categories.requireForEntry(input.categoryId, input.kind);
    const clientId = input.kind === "income" ? input.clientId : null;

    if (clientId !== null) {
      await this.#clients.requireForEntry(clientId);
    }

    return await this.#repo.insert({ ...input, clientId });
  }

  /** Entries created by "mark paid" belong to their invoice; change the invoice instead. */
  static #assertNotLinked(row: TransactionRow): void {
    if (row.invoiceId !== null) {
      throw domainError("finances.transaction_linked");
    }
  }

  async update(
    transactionId: string,
    changes: Partial<TransactionInput>
  ): Promise<void> {
    const current = await this.get(transactionId);
    TransactionsService.#assertNotLinked(current);
    const kind = changes.kind ?? current.kind;
    const categoryId = changes.categoryId ?? current.categoryId;

    if (changes.kind !== undefined || changes.categoryId !== undefined) {
      await this.#categories.requireForEntry(
        categoryId,
        kind,
        current.categoryId
      );
    }

    const patch: TransactionPatch = { ...changes };

    if (kind === "expense") {
      patch.clientId = null;
    } else if (changes.clientId !== undefined && changes.clientId !== null) {
      await this.#clients.requireForEntry(changes.clientId, current.clientId);
    }

    await this.#repo.update(transactionId, patch);
  }

  /** Soft delete; `restore` undoes it within the undo window. */
  async delete(transactionId: string): Promise<void> {
    TransactionsService.#assertNotLinked(await this.get(transactionId));
    await this.#repo.setDeleted(transactionId, this.#now().toISOString());
  }

  async restore(transactionId: string): Promise<void> {
    const row = await this.#repo.findById(transactionId, {
      includeDeleted: true,
    });

    if (!row) {
      throw notFound();
    }

    await this.#repo.setDeleted(transactionId, null);
  }

  /** Permanently removes rows deleted longer ago than the undo window; returns their ids. */
  async purgeExpired(): Promise<string[]> {
    const cutoff = new Date(
      this.#now().getTime() - UNDO_WINDOW_DAYS * MS_PER_DAY
    ).toISOString();

    const ids = await this.#repo.deletedBefore(cutoff);
    await this.#repo.purge(ids);

    return ids;
  }
}
