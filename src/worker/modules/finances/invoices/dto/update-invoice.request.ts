import { z } from "zod";

import {
  currency as currencyCode,
  isoDate,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const updateInvoiceParams = z.object({ invoiceId: z.uuid() });

/** Paid invoices are locked: mark them unpaid first. */
export const updateInvoiceRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000).optional(),
  clientId: z.uuid().optional(),
  currency: currencyCode.optional(),
  description: optionalText(300).optional(),
  dueDate: isoDate.optional(),
  issueDate: isoDate.optional(),
  /** Also mark a draft sent ("Save & mark sent" when editing). */
  markSent: z.boolean().optional(),
  notes: optionalText(2000).optional(),
  number: shortText(40).optional(),
  periodEnd: isoDate.nullable().optional(),
  periodStart: isoDate.nullable().optional(),
  projectId: z.uuid().nullable().optional(),
});
