import { z } from "zod";

import { currency, isoDate } from "../../../../core/zod-primitives";

export const markPaidParams = z.object({ invoiceId: z.uuid() });

export const markPaidRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000),
  /** The currency the money arrived in; defaults to the invoice's. */
  currency: currency.optional(),
  paidDate: isoDate,
});
