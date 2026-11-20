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
import { priceLines } from "./invoice-lines";
import type { InvoiceLineInput, PricedLines } from "./invoice-lines";
import type { InvoiceLinesRepositoryPort } from "./invoice-lines.repository";
import { InvoicePayments } from "./invoice-payment";
import { InvoiceReads } from "./invoice-reads";
import type { InvoiceDocumentData } from "./invoice-reads";
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

export type { InvoiceLineInput } from "./invoice-lines";

export type { InvoiceDocumentData } from "./invoice-reads";

export type { InvoiceStatusFilter } from "./invoice-selection";

/**
 * Invoices: drafts (recorded or itemised), issuing with a per-year number, void, paid /
 * unpaid. Reading lives in `InvoiceReads`, numbering in `InvoiceIssuing`.
 */
export class InvoicesService {
  readonly #repo: InvoicesRepositoryPort;
  readonly #lines: InvoiceLinesRepositoryPort;
  readonly #transactions: InvoiceTransactionsPort;
  readonly #clients: Pick<ClientsService, "requireForEntry">;
  readonly #projects: Pick<ProjectsService, "requireForInvoice">;
  readonly #businessProfile: Pick<BusinessProfileService, "get">;
  readonly #clock: ClockPort;
  readonly #issuing: InvoiceIssuing;
  readonly #payments: InvoicePayments;
  readonly #reads: InvoiceReads;

  constructor(deps: {
    repo: InvoicesRepositoryPort;
    lines: InvoiceLinesRepositoryPort;
    transactions: InvoiceTransactionsPort;
    categories: Pick<CategoriesService, "invoicesCategory">;
    clients: Pick<ClientsService, "requireForEntry" | "get">;
    settings: Pick<FinanceSettingsService, "get">;
    projects: Pick<ProjectsService, "requireForInvoice">;
    attachments: AttachmentsRepositoryPort;
    clock: ClockPort;
    household: Pick<HouseholdRepository, "preferences">;
    businessProfile: Pick<BusinessProfileService, "get" | "issuerSnapshot">;
  }) {
    this.#repo = deps.repo;
    this.#lines = deps.lines;
    this.#transactions = deps.transactions;
    this.#clients = deps.clients;
    this.#projects = deps.projects;
    this.#businessProfile = deps.businessProfile;
    this.#clock = deps.clock;
    this.#issuing = new InvoiceIssuing(deps);
    this.#payments = new InvoicePayments(deps);
    this.#reads = new InvoiceReads(deps);
  }

  async list(filter: {
    status: InvoiceStatusFilter;
    clientId: string | null;
    year: number;
  }): Promise<InvoiceList> {
    return await this.#reads.list(filter);
  }

  async waiting(): Promise<{
    rows: InvoiceListRow[];
    receivables: Receivables;
  }> {
    return await this.#reads.waiting();
  }

  async get(invoiceId: string): Promise<InvoiceDetail> {
    return await this.#reads.get(invoiceId);
  }

  async document(invoiceId: string): Promise<InvoiceDocumentData> {
    return await this.#reads.document(invoiceId);
  }

  /** The suggested number for `year` (this year by default) and the one it continues from. */
  async nextNumber(
    year?: number
  ): Promise<{ number: string; previous: string | null }> {
    return await this.#issuing.nextNumber(year);
  }

  async #find(invoiceId: string): Promise<InvoiceWithClient> {
    return await this.#reads.find(invoiceId);
  }

  /** Lines priced with today's VAT registration; null when there are none (recorded). */
  async #price(
    lines: readonly InvoiceLineInput[] | undefined
  ): Promise<PricedLines | null> {
    if (lines === undefined || lines.length === 0) {
      return null;
    }

    const profile = await this.#businessProfile.get();

    return priceLines(lines, profile?.vatRegistered ?? false);
  }

  async #checkRefs(
    clientId: string,
    projectId: string | null,
    keptClient: string | null
  ): Promise<void> {
    await this.#clients.requireForEntry(clientId, keptClient);

    if (projectId !== null) {
      await this.#projects.requireForInvoice(projectId, clientId);
    }
  }

  /** A draft, or (with `issue`) an invoice issued straight away. Itemised when it has lines. */
  async create(
    { lines, ...input }: InvoiceInput,
    issue: IssueRequest
  ): Promise<{ id: string; number: string | null }> {
    await this.#checkRefs(input.clientId, input.projectId, null);
    const priced = await this.#price(lines);

    const values = {
      ...input,
      amountMinor: priced?.totals.totalMinor ?? input.amountMinor,
    };

    const issued =
      issue === null
        ? { number: null, status: "draft" as const }
        : await this.#issuing.issuedFields(
            { ...values, itemised: priced !== null },
            issue.number,
            null
          );

    const row = await guardNumberRace(
      async () => await this.#repo.insert({ ...values, ...issued })
    );

    if (priced !== null) {
      await this.#lines.replace(row.id, priced.rows);
    }

    return { id: row.id, number: issued.number };
  }

  /** Issued (sent or void) invoices only take notes. */
  async #updateIssued(
    invoice: InvoiceWithClient,
    changes: Partial<InvoiceInput>,
    issue: IssueRequest
  ): Promise<string | null> {
    const locked = Object.entries(changes).some(
      ([key, value]) => value !== undefined && !EDITABLE_AFTER_ISSUE.has(key)
    );

    if (locked || issue !== null) {
      throw domainError(ISSUED);
    }

    await this.#repo.update(invoice.id, { notes: changes.notes });

    return invoice.number;
  }

  /**
   * Edits a draft (and optionally issues it). `lines` replaces its lines (empty makes it a
   * recorded invoice again). Issued invoices only take notes; paid ones are locked.
   */
  async update(
    invoiceId: string,
    { lines, ...changes }: Partial<InvoiceInput>,
    issue: IssueRequest = null
  ): Promise<string | null> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status === "paid") {
      throw domainError(ALREADY_PAID);
    }

    if (invoice.status !== "draft") {
      return await this.#updateIssued(invoice, { ...changes, lines }, issue);
    }

    await this.#checkRefs(
      changes.clientId ?? invoice.clientId,
      changes.projectId === undefined ? invoice.projectId : changes.projectId,
      invoice.clientId
    );

    const priced = await this.#price(lines);
    const patch: InvoicePatch = { ...changes };

    if (priced !== null) {
      patch.amountMinor = priced.totals.totalMinor;
    }

    // A new due date earns a fresh overdue heads-up.
    if (changes.dueDate !== undefined && changes.dueDate !== invoice.dueDate) {
      patch.overdueNotifiedAt = null;
    }

    await this.#repo.update(invoiceId, patch);

    if (lines !== undefined) {
      await this.#lines.replace(invoiceId, priced?.rows ?? []);
    }

    return issue === null ? null : await this.issue(invoiceId, issue.number);
  }

  /**
   * Gives a draft its number (typed, or the next of its issue year), freezes your details and
   * the client's, and marks it sent. Itemised drafts need your business profile. Returns the
   * number.
   */
  async issue(invoiceId: string, typed: string | null): Promise<string> {
    const invoice = await this.#find(invoiceId);

    if (invoice.status !== "draft") {
      throw domainError(ISSUED);
    }

    const lineCounts = await this.#lines.countByInvoice([invoiceId]);

    const issued = await this.#issuing.issuedFields(
      { ...invoice, itemised: (lineCounts.get(invoiceId) ?? 0) > 0 },
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
