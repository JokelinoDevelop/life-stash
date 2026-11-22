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

export const createInvoiceRequest = z
  .object({
    /** Typed for recorded invoices; itemised ones are computed from their lines. */
    amountMinor: z.number().int().min(0).max(100_000_000_000),
    clientId: z.uuid(),
    currency: currencyCode,
    description: optionalText(300),
    dueDate: isoDate,
    /** Issue it now ("Issue") instead of saving a draft. */
    issue: z.boolean(),
    issueDate: isoDate,
    /** Itemised invoices: up to 100 lines. Empty = a recorded invoice (made elsewhere). */
    lines: z.array(invoiceLine).max(100).default([]),
    notes: optionalText(2000),
    /** The number to issue with (`YYYY-NNN` or a plain `NNN`); null takes the next one. */
    number: shortText(40).nullable().default(null),
    periodEnd: isoDate.nullable(),
    periodStart: isoDate.nullable(),
    projectId: z.uuid().nullable().default(null),
    purchaseOrder: optionalText(60).default(null),
    /** Itemised invoices: shipping, added after VAT. */
    shippingMinor: z.number().int().min(0).max(10_000_000_000).default(0),
  })
  .refine((input) => input.lines.length > 0 || input.amountMinor > 0, {
    message: "A recorded invoice needs an amount",
    path: ["amountMinor"],
  });
