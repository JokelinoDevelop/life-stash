import { z } from "zod";

import { isoDateField, parseAmount, requiredAmount } from "@/lib/form-schemas";

export const markPaidFormSchema = z.object({
  amount: requiredAmount.refine(
    (value) => (parseAmount(value) ?? 0) > 0,
    "validation.required"
  ),
  paidDate: isoDateField,
});

export type MarkPaidFormValues = z.infer<typeof markPaidFormSchema>;
