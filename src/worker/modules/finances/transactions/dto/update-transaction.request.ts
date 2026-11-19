import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import {
  currency,
  isoDate,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const updateTransactionParams = z.object({ transactionId: z.uuid() });

export const updateTransactionRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000).optional(),
  categoryId: z.uuid().optional(),
  currency: currency.optional(),
  date: isoDate.optional(),
  description: shortText(120).optional(),
  kind: z.enum(TRANSACTION_KINDS).optional(),
  notes: optionalText(1000).optional(),
});
