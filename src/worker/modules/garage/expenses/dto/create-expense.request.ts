import { EXPENSE_CATEGORIES } from "@shared/domain/garage-kinds";
import { z } from "zod";

import {
  currency as currencyCode,
  isoDate,
  kilometres,
  moneyMinor,
  optionalText,
} from "../../../../core/zod-primitives";

export const createExpenseRequest = z.object({
  amountMinor: moneyMinor,
  carId: z.uuid(),
  category: z.enum(EXPENSE_CATEGORIES),
  currency: currencyCode,
  date: isoDate,
  notes: optionalText(1000),
  odometerKm: kilometres.nullable(),
  quantityMilli: z.number().int().min(0).max(100_000_000).nullable(),
  reminderId: z.uuid().nullable(),
});
