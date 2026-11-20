import { z } from "zod";

import {
  currency as currencyCode,
  isoDate,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const updateInvoiceParams = z.object({ invoiceId: z.uuid() });

/** Drafts take every field; issued invoices only `notes`; paid ones nothing until marked unpaid. */
export const updateInvoiceRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000).optional(),
  clientId: z.uuid().optional(),
  currency: currencyCode.optional(),
  description: optionalText(300).optional(),
  dueDate: isoDate.optional(),
  /** Also issue the draft after saving it. */
  issue: z.boolean().optional(),
  issueDate: isoDate.optional(),
  notes: optionalText(2000).optional(),
  /** The number to issue with; null or absent takes the next one. */
  number: shortText(40).nullable().optional(),
  periodEnd: isoDate.nullable().optional(),
  periodStart: isoDate.nullable().optional(),
  projectId: z.uuid().nullable().optional(),
});
