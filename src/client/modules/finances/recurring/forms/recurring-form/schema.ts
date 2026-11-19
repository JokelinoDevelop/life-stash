import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  parseAmount,
  parseInteger,
  requiredAmount,
  requiredInteger,
  requiredText,
} from "@/lib/form-schemas";

export const recurringFormSchema = z.object({
  active: z.boolean(),
  amount: requiredAmount.refine(
    (value) => (parseAmount(value) ?? 0) > 0,
    "validation.required"
  ),
  categoryId: z.string().min(1, "validation.required"),
  /** "none" = nobody in particular. */
  clientId: z.string(),
  currency: z.enum(CURRENCIES),
  dayOfMonth: requiredInteger.refine((value) => {
    const day = parseInteger(value) ?? 0;

    return day >= 1 && day <= 31;
  }, "validation.number"),
  description: requiredText(120),
});

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;
