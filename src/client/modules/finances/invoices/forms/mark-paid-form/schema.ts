import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import { isoDateField, parseAmount, requiredAmount } from "@/lib/form-schemas";

export const markPaidFormSchema = z.object({
  amount: requiredAmount.refine(
    (value) => (parseAmount(value) ?? 0) > 0,
    "validation.required"
  ),
  currency: z.enum(CURRENCIES),
  paidDate: isoDateField,
});

export type MarkPaidFormValues = z.infer<typeof markPaidFormSchema>;
