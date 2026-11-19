import type { StoredInvoiceStatus } from "./invoices";

export interface RemindableInvoice {
  id: string;
  status: StoredInvoiceStatus;
  dueDate: string;
  overdueNotifiedAt: string | null;
}

/**
 * Invoices due a push heads-up: sent, overdue (due date before today) and not notified yet.
 * The daily cron sends one per invoice, the day after it becomes overdue.
 */
export const invoicesToRemind = <T extends RemindableInvoice>(
  invoices: readonly T[],
  today: string
): T[] =>
  invoices.filter(
    (invoice) =>
      invoice.status === "sent" &&
      invoice.dueDate < today &&
      invoice.overdueNotifiedAt === null
  );
