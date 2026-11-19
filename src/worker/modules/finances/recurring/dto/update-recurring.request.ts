import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import {
  currency as currencyCode,
  shortText,
} from "../../../../core/zod-primitives";

export const updateRecurringParams = z.object({ recurringId: z.uuid() });

export const updateRecurringRequest = z.object({
  active: z.boolean().optional(),
  amountMinor: z.number().int().min(1).max(100_000_000_000).optional(),
  categoryId: z.uuid().optional(),
  clientId: z.uuid().nullable().optional(),
  currency: currencyCode.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  description: shortText(120).optional(),
  kind: z.enum(TRANSACTION_KINDS).optional(),
});
