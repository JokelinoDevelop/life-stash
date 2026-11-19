import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

export const markPaidParams = z.object({ invoiceId: z.uuid() });

export const markPaidRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000),
  paidDate: isoDate,
});
