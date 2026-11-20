import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  isoDateField,
  optionalText,
  parseAmount,
  requiredAmount,
} from "@/lib/form-schemas";

export const invoiceFormSchema = z.object({
  amount: requiredAmount.refine(
    (value) => (parseAmount(value) ?? 0) > 0,
    "validation.required"
  ),
  clientId: z.string().min(1, "validation.required"),
  currency: z.enum(CURRENCIES),
  description: optionalText(300),
  dueDate: isoDateField,
  issueDate: isoDateField,
  notes: optionalText(2000),
  /** Empty takes the next number when issuing; drafts have none. */
  number: optionalText(40),
  /** `YYYY-MM` of the billed month, or "none". */
  period: z.string(),
  /** A project of the chosen client, or "none". */
  projectId: z.string(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
