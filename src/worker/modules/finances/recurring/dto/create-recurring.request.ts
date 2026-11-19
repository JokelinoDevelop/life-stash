import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import {
  currency as currencyCode,
  shortText,
} from "../../../../core/zod-primitives";

export const createRecurringRequest = z.object({
  active: z.boolean().default(true),
  amountMinor: z.number().int().min(1).max(100_000_000_000),
  categoryId: z.uuid(),
  clientId: z.uuid().nullable(),
  currency: currencyCode,
  dayOfMonth: z.number().int().min(1).max(31),
  description: shortText(120),
  kind: z.enum(TRANSACTION_KINDS),
});
