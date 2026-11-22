import type {
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
  InvoiceLanguage,
  InvoiceTotals,
} from "@shared/domain/finances/invoice-document";
import { invoiceTotals } from "@shared/domain/finances/invoice-document";
import { invoiceStatus, receivables } from "@shared/domain/finances/invoices";
import type { Receivables } from "@shared/domain/finances/invoices";

import { notFound } from "../../../core/errors";
import type { AttachmentsRepositoryPort } from "../attachments/attachments.repository";
import type { BusinessProfileService } from "../business-profile/business-profile.service";
import type { ClientsService } from "../clients/clients.service";
import type { ClockPort } from "../household/clock";
import type {
  InvoiceLineRow,
  InvoiceLinesRepositoryPort,
} from "./invoice-lines.repository";
import { selectInvoices } from "./invoice-selection";
import type { InvoiceStatusFilter } from "./invoice-selection";
import type {
  InvoiceDetail,
  InvoiceList,
  InvoiceListRow,
  InvoiceTransactionsPort,
} from "./invoice-types";
import type {
  InvoicesRepositoryPort,
  InvoiceWithClient,
} from "./invoices.repository";

/** What an invoice PDF is rendered from: frozen when issued, live while a draft. */
export interface InvoiceDocumentData {
  invoice: InvoiceWithClient;
  language: InvoiceLanguage;
  issuer: InvoiceIssuerSnapshot | null;
  client: InvoiceClientSnapshot;
  lines: InvoiceLineRow[];
  totals: InvoiceTotals;
}

/** Reading invoices: the list page, the overview's waiting list, one invoice, its document. */
export class InvoiceReads {
  readonly #repo: Pick<InvoicesRepositoryPort, "list" | "findById">;
  readonly #lines: Pick<InvoiceLinesRepositoryPort, "list" | "countByInvoice">;
  readonly #attachments: AttachmentsRepositoryPort;
  readonly #transactions: Pick<InvoiceTransactionsPort, "findByInvoice">;
  readonly #clients: Pick<ClientsService, "get">;
  readonly #businessProfile: Pick<BusinessProfileService, "get">;
  readonly #clock: ClockPort;

  constructor(deps: {
    repo: Pick<InvoicesRepositoryPort, "list" | "findById">;
    lines: Pick<InvoiceLinesRepositoryPort, "list" | "countByInvoice">;
    attachments: AttachmentsRepositoryPort;
    transactions: Pick<InvoiceTransactionsPort, "findByInvoice">;
    clients: Pick<ClientsService, "get">;
    businessProfile: Pick<BusinessProfileService, "get">;
    clock: ClockPort;
  }) {
    this.#repo = deps.repo;
    this.#lines = deps.lines;
    this.#attachments = deps.attachments;
    this.#transactions = deps.transactions;
    this.#clients = deps.clients;
    this.#businessProfile = deps.businessProfile;
    this.#clock = deps.clock;
  }

  async find(invoiceId: string): Promise<InvoiceWithClient> {
    const invoice = await this.#repo.findById(invoiceId);

    if (!invoice) {
      throw notFound();
    }

    return invoice;
  }

  async #withDerived(
    invoices: readonly InvoiceWithClient[],
    today: string
  ): Promise<InvoiceListRow[]> {
    const ids = invoices.map((invoice) => invoice.id);

    const [files, lines] = await Promise.all([
      this.#attachments.countByOwner("finance_invoice", ids),
      this.#lines.countByInvoice(ids),
    ]);

    return invoices.map((invoice) => {
      const { daysOverdue, status } = invoiceStatus(invoice, today);

      return {
        ...invoice,
        attachments: files.get(invoice.id) ?? 0,
        daysOverdue,
        displayStatus: status,
        itemised: (lines.get(invoice.id) ?? 0) > 0,
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

  async get(invoiceId: string): Promise<InvoiceDetail> {
    const [invoice, today] = await Promise.all([
      this.find(invoiceId),
      this.#clock.today(),
    ]);

    const [rows, transaction, firstAttachedAt, lines] = await Promise.all([
      this.#withDerived([invoice], today),
      this.#transactions.findByInvoice(invoiceId),
      this.#attachments.firstAttachedAt("finance_invoice", invoiceId),
      this.#lines.list(invoiceId),
    ]);

    const [row] = rows;

    if (row === undefined) {
      throw notFound();
    }

    return {
      ...row,
      firstAttachedAt,
      lines,
      transaction: transaction ?? null,
    };
  }

  async #liveIssuer(): Promise<InvoiceIssuerSnapshot | null> {
    const profile = await this.#businessProfile.get();

    if (profile === null) {
      return null;
    }

    const { defaultVatRateBp: _rate, ...issuer } = profile;

    return issuer;
  }

  async #liveClient(clientId: string): Promise<InvoiceClientSnapshot> {
    const client = await this.#clients.get(clientId);

    return {
      address: client.address,
      email: client.email,
      language: client.invoiceLanguage,
      name: client.name,
      taxId: client.taxId,
    };
  }

  /**
   * The data an invoice PDF is drawn from. Issued invoices use the details frozen when they
   * were issued; drafts (and invoices issued before F4) use today's profile and client.
   */
  async document(invoiceId: string): Promise<InvoiceDocumentData> {
    const invoice = await this.find(invoiceId);

    const [lines, issuer, client] = await Promise.all([
      this.#lines.list(invoiceId),
      invoice.issuerSnapshot ?? this.#liveIssuer(),
      invoice.clientSnapshot ?? this.#liveClient(invoice.clientId),
    ]);

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    return {
      client,
      invoice,
      issuer,
      language: client.language,
      lines,
      totals: invoiceTotals(lines, invoice.shippingMinor),
    };
  }
}
