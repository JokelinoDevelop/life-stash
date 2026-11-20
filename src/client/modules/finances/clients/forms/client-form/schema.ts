import { INVOICE_LANGUAGES } from "@shared/domain/finances/invoice-document";
import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  optionalText,
  requiredInteger,
  requiredText,
} from "@/lib/form-schemas";

export const clientFormSchema = z.object({
  address: optionalText(500),
  currency: z.enum(CURRENCIES),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "validation.email"
    ),
  invoiceLanguage: z.enum(INVOICE_LANGUAGES),
  kind: z.enum(["client", "employer"]),
  name: requiredText(120),
  notes: optionalText(2000),
  paymentTermsDays: requiredInteger,
  taxId: optionalText(40),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
