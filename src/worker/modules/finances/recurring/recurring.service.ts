import type { TransactionKind } from "@shared/domain/finances/kinds";
import {
  confirmDate,
  pendingRecurring,
} from "@shared/domain/finances/recurring";
import type { Currency } from "@shared/domain/money";

import { domainError, notFound } from "../../../core/errors";
import type { CategoriesService } from "../categories/categories.service";
import type { ClientsService } from "../clients/clients.service";
import type { ClockPort } from "../household/clock";
import type {
  TransactionRow,
  TransactionsRepositoryPort,
} from "../transactions/transactions.repository";
import type {
  RecurringRepositoryPort,
  RecurringRow,
  RecurringWithNames,
} from "./recurring.repository";

export interface RecurringInput {
  kind: TransactionKind;
  clientId: string | null;
  categoryId: string;
  description: string;
  amountMinor: number;
  currency: Currency;
  dayOfMonth: number;
  active: boolean;
}

export type PendingRecurring = RecurringWithNames & { dueDate: string };

/**
 * Recurring income (or spending) templates. Each month the overview asks to Confirm (books one
 * entry) or Skip; both mark the month handled. Nothing is ever booked automatically.
 */
export class RecurringService {
  readonly #repo: RecurringRepositoryPort;
  readonly #transactions: Pick<TransactionsRepositoryPort, "insert">;
  readonly #categories: Pick<CategoriesService, "requireForEntry">;
  readonly #clients: Pick<ClientsService, "requireForEntry">;
  readonly #clock: ClockPort;

  constructor(deps: {
    repo: RecurringRepositoryPort;
    transactions: Pick<TransactionsRepositoryPort, "insert">;
    categories: Pick<CategoriesService, "requireForEntry">;
    clients: Pick<ClientsService, "requireForEntry">;
    clock: ClockPort;
  }) {
    this.#repo = deps.repo;
    this.#transactions = deps.transactions;
    this.#categories = deps.categories;
    this.#clients = deps.clients;
    this.#clock = deps.clock;
  }

  async list(): Promise<RecurringWithNames[]> {
    return await this.#repo.list();
  }

  async pending(): Promise<PendingRecurring[]> {
    const [rows, today] = await Promise.all([
      this.#repo.list(),
      this.#clock.today(),
    ]);

    return pendingRecurring(rows, today);
  }

  async #get(recurringId: string): Promise<RecurringRow> {
    const row = await this.#repo.findById(recurringId);

    if (!row) {
      throw notFound();
    }

    return row;
  }

  async #validate(
    input: Pick<RecurringInput, "categoryId" | "kind" | "clientId">,
    current?: RecurringRow
  ) {
    await this.#categories.requireForEntry(
      input.categoryId,
      input.kind,
      current?.categoryId ?? null
    );

    if (input.clientId !== null) {
      await this.#clients.requireForEntry(
        input.clientId,
        current?.clientId ?? null
      );
    }
  }

  async create(input: RecurringInput): Promise<RecurringRow> {
    await this.#validate(input);

    return await this.#repo.insert({ ...input, lastHandledMonth: null });
  }

  async update(
    recurringId: string,
    changes: Partial<RecurringInput>
  ): Promise<void> {
    const current = await this.#get(recurringId);
    const merged = { ...current, ...changes };

    if (
      changes.categoryId !== undefined ||
      changes.kind !== undefined ||
      changes.clientId !== undefined
    ) {
      await this.#validate(merged, current);
    }

    await this.#repo.update(recurringId, changes);
  }

  async delete(recurringId: string): Promise<void> {
    await this.#get(recurringId);
    await this.#repo.delete(recurringId);
  }

  /** This month's pending entry for a template; refuses one already confirmed or skipped. */
  async #pending(recurringId: string) {
    const [template, today] = await Promise.all([
      this.#get(recurringId),
      this.#clock.today(),
    ]);

    const [pending] = pendingRecurring([template], today);

    if (pending === undefined) {
      throw domainError("finances.recurring_already_handled");
    }

    return { month: today.slice(0, 7), pending, template, today };
  }

  /** Books this month's entry and marks the month handled (once per month). */
  async confirm(recurringId: string): Promise<TransactionRow> {
    const { month, pending, template, today } =
      await this.#pending(recurringId);

    // Claim the month first, so a double click can't book it twice.
    const claimed = await this.#repo.claimMonth(
      recurringId,
      month,
      template.lastHandledMonth
    );

    if (!claimed) {
      throw domainError("finances.recurring_already_handled");
    }

    const date = confirmDate(pending.dueDate, today);

    try {
      // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
      return await this.#transactions.insert({
        amountMinor: template.amountMinor,
        categoryId: template.categoryId,
        clientId: template.kind === "income" ? template.clientId : null,
        currency: template.currency,
        date,
        description: template.description,
        kind: template.kind,
        notes: null,
        recurringId,
      });
    } catch (error) {
      // Nothing was booked: give the month back so Confirm can be retried.
      await this.#repo.update(recurringId, {
        lastHandledMonth: template.lastHandledMonth,
      });

      throw error;
    }
  }

  /** Marks this month handled without booking anything. */
  async skip(recurringId: string): Promise<void> {
    const { month } = await this.#pending(recurringId);
    await this.#repo.update(recurringId, { lastHandledMonth: month });
  }
}
