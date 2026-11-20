import {
  BASIS_POINTS,
  MAX_UNIT_LENGTH,
} from "@shared/domain/finances/invoice-document";
import { z } from "zod";

import {
  currency as currencyCode,
  isoDate,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

/** One line of an itemised invoice (quantities in thousandths, VAT in basis points). */
const invoiceLine = z.object({
  description: shortText(300),
  quantityMilli: z.number().int().min(1).max(100_000_000),
  unit: optionalText(MAX_UNIT_LENGTH),
  unitPriceMinor: z.number().int().min(0).max(10_000_000_000),
  vatRateBp: z.number().int().min(0).max(BASIS_POINTS),
});

export const updateInvoiceParams = z.object({ invoiceId: z.uuid() });

/** Drafts take every field; issued invoices only `notes`; paid ones nothing until marked unpaid. */
export const updateInvoiceRequest = z.object({
  amountMinor: z.number().int().min(0).max(100_000_000_000).optional(),
  clientId: z.uuid().optional(),
  currency: currencyCode.optional(),
  description: optionalText(300).optional(),
  dueDate: isoDate.optional(),
  /** Also issue the draft after saving it. */
  issue: z.boolean().optional(),
  issueDate: isoDate.optional(),
  /** Replaces the lines (the amount is recomputed); empty makes it a recorded invoice. */
  lines: z.array(invoiceLine).max(100).optional(),
  notes: optionalText(2000).optional(),
  /** The number to issue with; null or absent takes the next one. */
  number: shortText(40).nullable().optional(),
  periodEnd: isoDate.nullable().optional(),
  periodStart: isoDate.nullable().optional(),
  projectId: z.uuid().nullable().optional(),
});
