import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import {
  currency as currencyCode,
  isoDate,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const createTransactionRequest = z.object({
  amountMinor: z.number().int().min(1).max(100_000_000_000),
  categoryId: z.uuid(),
  currency: currencyCode,
  date: isoDate,
  description: shortText(120),
  kind: z.enum(TRANSACTION_KINDS),
  notes: optionalText(1000),
});
