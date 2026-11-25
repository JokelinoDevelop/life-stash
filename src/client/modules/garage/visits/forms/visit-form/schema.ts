import { VISIT_KINDS } from "@shared/domain/garage-kinds";
import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  optionalAmount,
  optionalInteger,
  optionalText,
  partialDateField,
  requiredText,
} from "@/lib/form-schemas";

export const visitItemSchema = z.object({
  cost: optionalAmount,
  /** Stable React key for the row. */
  key: z.string(),
  label: requiredText(80),
});

export const visitFormSchema = z.object({
  byPreviousOwner: z.boolean(),
  currency: z.enum(CURRENCIES),
  date: partialDateField,
  items: z.array(visitItemSchema).min(1, "validation.required"),
  kind: z.enum(VISIT_KINDS),
  notes: optionalText(),
  odometer: optionalInteger,
  shop: optionalText(120),
  total: optionalAmount,
});

export type VisitFormValues = z.infer<typeof visitFormSchema>;

export type VisitFormItem = z.infer<typeof visitItemSchema>;
