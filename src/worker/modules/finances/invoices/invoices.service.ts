import { invoiceStatus, receivables } from "@shared/domain/finances/invoices";
import type { Receivables } from "@shared/domain/finances/invoices";

import { domainError, notFound } from "../../../core/errors";
import type { AttachmentsRepositoryPort } from "../attachments/attachments.repository";
import type { BusinessProfileService } from "../business-profile/business-profile.service";
import type { CategoriesService } from "../categories/categories.service";
import type { ClientsService } from "../clients/clients.service";
import type { ClockPort } from "../household/clock";
import type { HouseholdRepository } from "../household/household.repository";
import type { ProjectsService } from "../projects/projects.service";
import type { FinanceSettingsService } from "../settings/settings.service";
import type { TransactionRow } from "../transactions/transactions.repository";
import { InvoiceIssuing, guardNumberRace } from "./invoice-issuing";
import { InvoicePayments } from "./invoice-payment";
import { selectInvoices } from "./invoice-selection";
import type { InvoiceStatusFilter } from "./invoice-selection";
import type {
  InvoiceDetail,
  InvoiceInput,
  InvoiceList,
  InvoiceListRow,
  InvoiceTransactionsPort,
  IssueRequest,
} from "./invoice-types";
import type {
  InvoicePatch,
  InvoicesRepositoryPort,
  InvoiceWithClient,
} from "./invoices.repository";

const ALREADY_PAID = "finances.invoice_already_paid";
const ISSUED = "finances.invoice_issued";

/** Fields an issued (sent or void) invoice still lets you change. */
const EDITABLE_AFTER_ISSUE = new Set<string>(["notes"]);

export type {
  InvoiceDetail,
  InvoiceInput,
  InvoiceList,
  InvoiceListRow,
  InvoiceTransactionsPort,
  IssueRequest,
} from "./invoice-types";

export type { InvoiceStatusFilter } from "./invoice-selection";

export class InvoicesService {
  readonly #repo: InvoicesRepositoryPort;
  readonly #transactions: InvoiceTransactionsPort;
  readonly #clients: Pick<ClientsService, "requireForEntry">;
  readonly #projects: Pick<ProjectsService, "requireForInvoice">;
  readonly #attachments: AttachmentsRepositoryPort;
  readonly #clock: ClockPort;
  readonly #issuing: InvoiceIssuing;
  readonly #payments: InvoicePayments;

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
    businessProfile: Pick<BusinessProfileService, "get" | "issuerSnapshot">;
  }) {
    this.#repo = deps.repo;
    this.#transactions = deps.transactions;
    this.#clients = deps.clients;
    this.#projects = deps.projects;
    this.#attachments = deps.attachments;
    this.#clock = deps.clock;
    this.#issuing = new InvoiceIssuing(deps);
    this.#payments = new InvoicePayments(deps);
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

  /** The suggested number for `year` (this year by default) and the one it continues from. */
  async nextNumber(
    year?: number
  ): Promise<{ number: string; previous: string | null }> {
    return await this.#issuing.nextNumber(year);
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

  /** A draft, or (with `issue`) an invoice issued straight away. */
  async create(
    input: InvoiceInput,
    issue: IssueRequest
  ): Promise<{ id: string; number: string | null }> {
    await this.#clients.requireForEntry(input.clientId);

    if (input.projectId !== null) {
      await this.#projects.requireForInvoice(input.projectId, input.clientId);
    }

    if (issue === null) {
      const row = await this.#repo.insert({
        ...input,
        number: null,
        status: "draft",
      });

      return { id: row.id, number: null };
    }

    const issued = await this.#issuing.issuedFields(
      { ...input, itemised: false },
      issue.number,
      null
    );

    const row = await guardNumberRace(
      async () => await this.#repo.insert({ ...input, ...issued })
    );

    return { id: row.id, number: issued.number };
  }

  /**
   * Edits a draft (and optionally issues it). Issued invoices only take notes; paid ones are
   * locked until marked unpaid.
   */
  async update(
    invoiceId: string,
    changes: Partial<InvoiceInput>,
    issue: IssueRequest = null
  ): Promise<string | null> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    if (invoice.status !== "draft") {
      const locked = Object.entries(changes).some(
        ([key, value]) => value !== undefined && !EDITABLE_AFTER_ISSUE.has(key)
      );

      if (locked || issue !== null) {
        throw domainError(ISSUED);
      }

      await this.#repo.update(invoiceId, { notes: changes.notes });

      return invoice.number;
    }

    if (changes.clientId !== undefined) {
      await this.#clients.requireForEntry(changes.clientId, invoice.clientId);
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

    if (issue === null) {
      return null;
    }

    return await this.issue(invoiceId, issue.number);
  }

  /**
   * Gives a draft its number (typed, or the next of its issue year), freezes your details and
   * the client's, and marks it sent. Returns the number.
   */
  async issue(invoiceId: string, typed: string | null): Promise<string> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status !== "draft") {
      throw domainError(ISSUED);
    }

    const issued = await this.#issuing.issuedFields(
      { ...invoice, itemised: false },
      typed,
      invoiceId
    );

    await guardNumberRace(async () => {
      await this.#repo.update(invoiceId, issued);
    });

    return issued.number;
  }

  /** Cancels a sent invoice: it stays listed (struck through) and its number stays used. */
  async markVoid(invoiceId: string): Promise<void> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    if (invoice.status === "draft") {
      throw domainError("finances.invoice_not_issued");
    }

    if (invoice.status === "void") {
      return;
    }

    await this.#repo.update(invoiceId, {
      status: "void",
      voidedAt: this.#clock.now().toISOString(),
    });
  }

  /** Books the money: one income entry in "Invoices", linked to the invoice. */
  async markPaid(
    invoiceId: string,
    payment: { paidDate: string; amountMinor: number }
  ): Promise<TransactionRow> {
    return await this.#payments.markPaid(await this.#find(invoiceId), payment);
  }

  /** Back to sent; removes the income entry. Returns the payment so Undo can re-book it. */
  async markUnpaid(
    invoiceId: string
  ): Promise<{ paidDate: string; amountMinor: number }> {
    return await this.#payments.markUnpaid(await this.#find(invoiceId));
  }

  /** Soft-deletes a draft, so Undo can bring it back. Issued invoices are voided instead. */
  async delete(invoiceId: string): Promise<void> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status !== "draft") {
      throw domainError(ISSUED);
    }

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

    if (invoice.number !== null) {
      await this.#issuing.assertNumberFree(invoice.number, invoiceId);
    }

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
