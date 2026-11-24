import { z } from "zod";

import {
  isoDateField,
  optionalText,
  parseAmount,
  requiredAmount,
} from "@/lib/form-schemas";

const MIN_KG = 20;
const MAX_KG = 400;

export const weightFormSchema = z.object({
  date: isoDateField,
  /** Kilograms as typed ("81,4" or "81.4"). */
  kg: requiredAmount.refine((value) => {
    const kg = parseAmount(value) ?? 0;

    return kg >= MIN_KG && kg <= MAX_KG;
  }, "validation.number"),
  note: optionalText(500),
});

export type WeightFormValues = z.infer<typeof weightFormSchema>;
