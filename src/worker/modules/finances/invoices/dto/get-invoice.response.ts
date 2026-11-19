import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { Currency } from "@shared/domain/money";

import type { InvoiceDetail } from "../invoices.service";

export interface GetInvoiceResponse {
  invoice: {
    id: string;
    number: string;
    clientId: string;
    clientName: string;
    projectId: string | null;
    projectName: string | null;
    issueDate: string;
    dueDate: string;
    periodStart: string | null;
    periodEnd: string | null;
    description: string | null;
    amountMinor: number;
    currency: Currency;
    notes: string | null;
    status: InvoiceStatus;
    daysOverdue: number;
    sentAt: string | null;
    paidAt: string | null;
    createdAt: string;
    attachments: number;
    firstAttachedAt: string | null;
    /** The income entry "mark paid" booked. */
    transaction: {
      id: string;
      date: string;
      amountMinor: number;
      currency: Currency;
    } | null;
  };
}

export const toGetInvoiceResponse = (
  detail: InvoiceDetail
): GetInvoiceResponse => ({
  invoice: {
    amountMinor: detail.amountMinor,
    attachments: detail.attachments,
    clientId: detail.clientId,
    clientName: detail.clientName,
    createdAt: detail.createdAt,
    currency: detail.currency,
    daysOverdue: detail.daysOverdue,
    description: detail.description,
    dueDate: detail.dueDate,
    firstAttachedAt: detail.firstAttachedAt,
    id: detail.id,
    issueDate: detail.issueDate,
    notes: detail.notes,
    number: detail.number,
    paidAt: detail.paidAt,
    periodEnd: detail.periodEnd,
    periodStart: detail.periodStart,
    projectId: detail.projectId,
    projectName: detail.projectName,
    sentAt: detail.sentAt,
    status: detail.displayStatus,
    transaction:
      detail.transaction === null
        ? null
        : {
            amountMinor: detail.transaction.amountMinor,
            currency: detail.transaction.currency,
            date: detail.transaction.date,
            id: detail.transaction.id,
          },
  },
});
