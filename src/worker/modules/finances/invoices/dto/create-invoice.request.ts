import { z } from "zod";

import {
  currency as currencyCode,
  isoDate,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const createInvoiceRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000),
  clientId: z.uuid(),
  currency: currencyCode,
  description: optionalText(300),
  dueDate: isoDate,
  issueDate: isoDate,
  /** "Save & mark sent" instead of "Save as draft". */
  markSent: z.boolean(),
  notes: optionalText(2000),
  number: shortText(40),
  periodEnd: isoDate.nullable(),
  periodStart: isoDate.nullable(),
});
