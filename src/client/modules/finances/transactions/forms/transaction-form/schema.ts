import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  isoDateField,
  optionalText,
  parseAmount,
  requiredAmount,
  requiredText,
} from "@/lib/form-schemas";

export const transactionFormSchema = z.object({
  amount: requiredAmount.refine(
    (value) => (parseAmount(value) ?? 0) > 0,
    "validation.required"
  ),
  categoryId: z.string().min(1, "validation.required"),
  /** "" = no client. */
  clientId: z.string(),
  currency: z.enum(CURRENCIES),
  date: isoDateField,
  description: requiredText(120),
  kind: z.enum(TRANSACTION_KINDS),
  notes: optionalText(1000),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
