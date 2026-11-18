import { z } from "zod";

import {
  isoDateField,
  optionalText,
  requiredInteger,
} from "@/lib/form-schemas";

export const readingFormSchema = z.object({
  date: isoDateField,
  notes: optionalText(500),
  odometer: requiredInteger,
});

export type ReadingFormValues = z.infer<typeof readingFormSchema>;
