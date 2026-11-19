import type { CategoriesService } from "../categories/categories.service";
import type { HouseholdRepository } from "../household/household.repository";
import type { TransactionRow } from "../transactions/transactions.repository";
import type { InvoiceTransactionsPort } from "./invoice-types";
import type { InvoiceWithClient } from "./invoices.repository";

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
      description: PAYMENT_DESCRIPTION[prefs.locale](invoice.number),
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
