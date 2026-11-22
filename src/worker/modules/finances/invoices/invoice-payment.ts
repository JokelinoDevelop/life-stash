import { domainError } from "../../../core/errors";
import type { CategoriesService } from "../categories/categories.service";
import type { HouseholdRepository } from "../household/household.repository";
import type { TransactionRow } from "../transactions/transactions.repository";
import type { InvoiceTransactionsPort } from "./invoice-types";
import type {
  InvoicesRepositoryPort,
  InvoiceWithClient,
} from "./invoices.repository";

/** The ledger entry "mark paid" books, in the household's language. */
const PAYMENT_DESCRIPTION = {
  en: (number: string) => `Invoice ${number}`,
  mk: (number: string) => `Фактура ${number}`,
} as const;

/**
 * Books an invoice's payment as one income entry in "Invoices". When a parallel request wins
 * the one-entry-per-invoice index, returns that request's entry instead of failing.
 */
export const bookInvoicePayment = async (
  deps: {
    categories: Pick<CategoriesService, "invoicesCategory">;
    household: Pick<HouseholdRepository, "preferences">;
    transactions: InvoiceTransactionsPort;
  },
  invoice: InvoiceWithClient,
  payment: { paidDate: string; amountMinor: number }
): Promise<TransactionRow> => {
  const [category, prefs] = await Promise.all([
    deps.categories.invoicesCategory(),
    deps.household.preferences(),
  ]);

  try {
    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    return await deps.transactions.insertForInvoice({
      amountMinor: payment.amountMinor,
      categoryId: category.id,
      clientId: invoice.clientId,
      currency: invoice.currency,
      date: payment.paidDate,
      description: PAYMENT_DESCRIPTION[prefs.locale](invoice.number ?? ""),
      invoiceId: invoice.id,
      kind: "income",
      notes: null,
    });
  } catch (error) {
    const booked = await deps.transactions.findByInvoice(invoice.id);

    if (booked === undefined) {
      throw error;
    }

    return booked;
  }
};

/** Mark paid / unpaid: the invoice's status and its one income entry move together. */
export class InvoicePayments {
  readonly #repo: Pick<InvoicesRepositoryPort, "update">;
  readonly #transactions: InvoiceTransactionsPort;
  readonly #categories: Pick<CategoriesService, "invoicesCategory">;
  readonly #household: Pick<HouseholdRepository, "preferences">;

  constructor(deps: {
    repo: Pick<InvoicesRepositoryPort, "update">;
    transactions: InvoiceTransactionsPort;
    categories: Pick<CategoriesService, "invoicesCategory">;
    household: Pick<HouseholdRepository, "preferences">;
  }) {
    this.#repo = deps.repo;
    this.#transactions = deps.transactions;
    this.#categories = deps.categories;
    this.#household = deps.household;
  }

  /** Books the money: one income entry in "Invoices", linked to the invoice. */
  async markPaid(
    invoice: InvoiceWithClient,
    payment: { paidDate: string; amountMinor: number }
  ): Promise<TransactionRow> {
    if (invoice.status === "paid") {
      throw domainError("finances.invoice_already_paid");
    }

    if (invoice.status === "void") {
      throw domainError("finances.invoice_void");
    }

    if (invoice.status === "draft") {
      throw domainError("finances.invoice_not_issued");
    }

    // A linked entry without "paid" means an earlier attempt (or a parallel request) booked it
    // but didn't finish; reuse it instead of booking twice.
    // oxlint-disable-next-line react-doctor/server-sequential-independent-await -- only after the checks above passed
    const transaction =
      (await this.#transactions.findByInvoice(invoice.id)) ??
      (await bookInvoicePayment(
        {
          categories: this.#categories,
          household: this.#household,
          transactions: this.#transactions,
        },
        invoice,
        payment
      ));

    await this.#repo.update(invoice.id, {
      paidAt: payment.paidDate,
      sentAt: invoice.sentAt ?? invoice.issueDate,
      status: "paid",
    });

    return transaction;
  }

  /** Back to sent; removes the income entry. Returns the payment so Undo can re-book it. */
  async markUnpaid(
    invoice: InvoiceWithClient
  ): Promise<{ paidDate: string; amountMinor: number }> {
    if (invoice.status !== "paid") {
      throw domainError("finances.invoice_not_paid");
    }

    const transaction = await this.#transactions.findByInvoice(invoice.id);
    await this.#transactions.deleteByInvoice(invoice.id);
    await this.#repo.update(invoice.id, { paidAt: null, status: "sent" });

    return {
      amountMinor: transaction?.amountMinor ?? invoice.amountMinor,
      paidDate: transaction?.date ?? invoice.paidAt ?? invoice.issueDate,
    };
  }
}
