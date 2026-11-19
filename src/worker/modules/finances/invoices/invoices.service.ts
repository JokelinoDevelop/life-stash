import {
  invoiceStatus,
  nextInvoiceNumber,
  previousInvoiceNumber,
  receivables,
} from "@shared/domain/finances/invoices";
import type { Receivables } from "@shared/domain/finances/invoices";

import { domainError, notFound } from "../../../core/errors";
import type { AttachmentsRepositoryPort } from "../attachments/attachments.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { ClientsService } from "../clients/clients.service";
import type { ClockPort } from "../household/clock";
import type { HouseholdRepository } from "../household/household.repository";
import type { ProjectsService } from "../projects/projects.service";
import type { FinanceSettingsService } from "../settings/settings.service";
import type { TransactionRow } from "../transactions/transactions.repository";
import { bookInvoicePayment } from "./invoice-payment";
import { selectInvoices } from "./invoice-selection";
import type { InvoiceStatusFilter } from "./invoice-selection";
import type {
  InvoiceDetail,
  InvoiceInput,
  InvoiceList,
  InvoiceListRow,
  InvoiceTransactionsPort,
} from "./invoice-types";
import type {
  InvoicePatch,
  InvoicesRepositoryPort,
  InvoiceWithClient,
} from "./invoices.repository";

const ALREADY_PAID = "finances.invoice_already_paid";

export type {
  InvoiceDetail,
  InvoiceInput,
  InvoiceList,
  InvoiceListRow,
  InvoiceTransactionsPort,
} from "./invoice-types";

export type { InvoiceStatusFilter } from "./invoice-selection";

export class InvoicesService {
  readonly #repo: InvoicesRepositoryPort;
  readonly #transactions: InvoiceTransactionsPort;
  readonly #categories: Pick<CategoriesService, "invoicesCategory">;
  readonly #clients: Pick<ClientsService, "requireForEntry">;
  readonly #settings: Pick<FinanceSettingsService, "get">;
  readonly #projects: Pick<ProjectsService, "requireForInvoice">;
  readonly #attachments: AttachmentsRepositoryPort;
  readonly #clock: ClockPort;
  readonly #household: Pick<HouseholdRepository, "preferences">;

  constructor(deps: {
    repo: InvoicesRepositoryPort;
    transactions: InvoiceTransactionsPort;
    categories: Pick<CategoriesService, "invoicesCategory">;
    clients: Pick<ClientsService, "requireForEntry">;
    settings: Pick<FinanceSettingsService, "get">;
    projects: Pick<ProjectsService, "requireForInvoice">;
    attachments: AttachmentsRepositoryPort;
    clock: ClockPort;
    household: Pick<HouseholdRepository, "preferences">;
  }) {
    this.#repo = deps.repo;
    this.#transactions = deps.transactions;
    this.#categories = deps.categories;
    this.#clients = deps.clients;
    this.#settings = deps.settings;
    this.#projects = deps.projects;
    this.#attachments = deps.attachments;
    this.#clock = deps.clock;
    this.#household = deps.household;
  }

  async #withDerived(
    invoices: readonly InvoiceWithClient[],
    today: string
  ): Promise<InvoiceListRow[]> {
    const counts = await this.#attachments.countByOwner(
      "finance_invoice",
      invoices.map((invoice) => invoice.id)
    );

    return invoices.map((invoice) => {
      const { daysOverdue, status } = invoiceStatus(invoice, today);

      return {
        ...invoice,
        attachments: counts.get(invoice.id) ?? 0,
        daysOverdue,
        displayStatus: status,
      };
    });
  }

  /**
   * Invoices for the list page. Unpaid ones always show (they need attention whatever their
   * year); paid and void ones only for `year`. Stats describe `year`.
   */
  async list(filter: {
    status: InvoiceStatusFilter;
    clientId: string | null;
    year: number;
  }): Promise<InvoiceList> {
    const [today, all] = await Promise.all([
      this.#clock.today(),
      this.#repo.list(
        filter.clientId === null ? {} : { clientId: filter.clientId }
      ),
    ]);

    const { stats, visible } = selectInvoices(all, filter, today);

    return { rows: await this.#withDerived(visible, today), stats };
  }

  /** Sent, unpaid invoices oldest-due first (the overview's "Waiting for payment"). */
  async waiting(): Promise<{
    rows: InvoiceListRow[];
    receivables: Receivables;
  }> {
    const [today, all] = await Promise.all([
      this.#clock.today(),
      this.#repo.list(),
    ]);

    const sent = all
      .filter((invoice) => invoice.status === "sent")
      .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      receivables: receivables(all, today),
      rows: await this.#withDerived(sent, today),
    };
  }

  async nextNumber(): Promise<{ number: string; previous: string | null }> {
    const [numbers, settings, today] = await Promise.all([
      this.#repo.numbers(),
      this.#settings.get(),
      this.#clock.today(),
    ]);

    const year = Number(today.slice(0, 4));

    return {
      number: nextInvoiceNumber(numbers, year, settings.invoiceNumberFormat),
      previous: previousInvoiceNumber(
        numbers,
        year,
        settings.invoiceNumberFormat
      ),
    };
  }

  async #find(invoiceId: string): Promise<InvoiceWithClient> {
    const invoice = await this.#repo.findById(invoiceId);

    if (!invoice) {
      throw notFound();
    }

    return invoice;
  }

  async get(invoiceId: string): Promise<InvoiceDetail> {
    const [invoice, today] = await Promise.all([
      this.#find(invoiceId),
      this.#clock.today(),
    ]);

    const [rows, transaction, firstAttachedAt] = await Promise.all([
      this.#withDerived([invoice], today),
      this.#transactions.findByInvoice(invoiceId),
      this.#attachments.firstAttachedAt("finance_invoice", invoiceId),
    ]);

    const [row] = rows;

    if (row === undefined) {
      throw notFound();
    }

    return { ...row, firstAttachedAt, transaction: transaction ?? null };
  }

  async #assertNumberFree(
    number: string,
    exceptId: string | null
  ): Promise<void> {
    if (await this.#repo.numberTaken(number, exceptId)) {
      throw domainError("finances.invoice_number_taken", { field: "number" });
    }
  }

  async create(input: InvoiceInput, markSent: boolean): Promise<string> {
    await this.#clients.requireForEntry(input.clientId);

    if (input.projectId !== null) {
      await this.#projects.requireForInvoice(input.projectId, input.clientId);
    }

    await this.#assertNumberFree(input.number, null);
    const today = await this.#clock.today();

    const row = await this.#repo.insert({
      ...input,
      sentAt: markSent ? today : null,
      status: markSent ? "sent" : "draft",
    });

    return row.id;
  }

  async update(
    invoiceId: string,
    changes: Partial<InvoiceInput>
  ): Promise<void> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    if (changes.clientId !== undefined) {
      await this.#clients.requireForEntry(changes.clientId, invoice.clientId);
    }

    if (changes.number !== undefined) {
      await this.#assertNumberFree(changes.number, invoiceId);
    }

    const projectId =
      changes.projectId === undefined ? invoice.projectId : changes.projectId;

    if (projectId !== null) {
      await this.#projects.requireForInvoice(
        projectId,
        changes.clientId ?? invoice.clientId
      );
    }

    const patch: InvoicePatch = { ...changes };

    // A new due date earns a fresh overdue heads-up.
    if (changes.dueDate !== undefined && changes.dueDate !== invoice.dueDate) {
      patch.overdueNotifiedAt = null;
    }

    await this.#repo.update(invoiceId, patch);
  }

  async markSent(invoiceId: string): Promise<void> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    await this.#repo.update(invoiceId, {
      sentAt: invoice.sentAt ?? (await this.#clock.today()),
      status: "sent",
    });
  }

  async markVoid(invoiceId: string): Promise<void> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    await this.#repo.update(invoiceId, { status: "void" });
  }

  /** Books the money: one income entry in "Invoices", linked to the invoice. */
  async markPaid(
    invoiceId: string,
    payment: { paidDate: string; amountMinor: number }
  ): Promise<TransactionRow> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    if (invoice.status === "void") {
      throw domainError("finances.invoice_void");
    }

    // A linked entry without "paid" means an earlier attempt (or a parallel request) booked it
    // but didn't finish; reuse it instead of booking twice.
    // oxlint-disable-next-line react-doctor/server-sequential-independent-await -- only after the checks above passed
    const transaction =
      (await this.#transactions.findByInvoice(invoiceId)) ??
      (await bookInvoicePayment(
        {
          categories: this.#categories,
          household: this.#household,
          transactions: this.#transactions,
        },
        invoice,
        payment
      ));

    await this.#repo.update(invoiceId, {
      paidAt: payment.paidDate,
      sentAt: invoice.sentAt ?? invoice.issueDate,
      status: "paid",
    });

    return transaction;
  }

  /** Back to sent; removes the income entry. Returns the payment so Undo can re-book it. */
  async markUnpaid(
    invoiceId: string
  ): Promise<{ paidDate: string; amountMinor: number }> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status !== "paid") {
      throw domainError("finances.invoice_not_paid");
    }

    const transaction = await this.#transactions.findByInvoice(invoiceId);
    await this.#transactions.deleteByInvoice(invoiceId);
    await this.#repo.update(invoiceId, { paidAt: null, status: "sent" });

    return {
      amountMinor: transaction?.amountMinor ?? invoice.amountMinor,
      paidDate: transaction?.date ?? invoice.paidAt ?? invoice.issueDate,
    };
  }

  /** Soft delete (with its ledger entry), so Undo can bring both back. */
  async delete(invoiceId: string): Promise<void> {
    await this.#find(invoiceId);
    const deletedAt = this.#clock.now().toISOString();
    await this.#transactions.setDeletedByInvoice(invoiceId, deletedAt);
    await this.#repo.setDeleted(invoiceId, deletedAt);
  }

  async restore(invoiceId: string): Promise<void> {
    const invoice = await this.#repo.findById(invoiceId, {
      includeDeleted: true,
    });

    if (!invoice) {
      throw notFound();
    }

    await this.#assertNumberFree(invoice.number, invoiceId);
    await this.#repo.setDeleted(invoiceId, null);
    await this.#transactions.setDeletedByInvoice(invoiceId, null);
  }

  /** Permanently removes invoices past the undo window; returns their ids. */
  async purgeExpired(cutoff: string): Promise<string[]> {
    const ids = await this.#repo.deletedBefore(cutoff);
    await this.#repo.purge(ids);

    return ids;
  }
}
