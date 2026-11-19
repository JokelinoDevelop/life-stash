import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  optionalText,
  requiredInteger,
  requiredText,
} from "@/lib/form-schemas";

export const clientFormSchema = z.object({
  currency: z.enum(CURRENCIES),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "validation.email"
    ),
  kind: z.enum(["client", "employer"]),
  name: requiredText(120),
  notes: optionalText(2000),
  paymentTermsDays: requiredInteger,
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
