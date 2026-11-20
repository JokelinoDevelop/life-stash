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
  /** Issue it now ("Issue") instead of saving a draft. */
  issue: z.boolean(),
  issueDate: isoDate,
  notes: optionalText(2000),
  /** The number to issue with (`YYYY-NNN` or a plain `NNN`); null takes the next one. */
  number: shortText(40).nullable().default(null),
  periodEnd: isoDate.nullable(),
  periodStart: isoDate.nullable(),
  projectId: z.uuid().nullable().default(null),
});
