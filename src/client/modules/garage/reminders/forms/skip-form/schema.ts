import { z } from "zod";

import { isoDateField, optionalInteger } from "@/lib/form-schemas";

export const skipFormSchema = z.object({
  date: isoDateField,
  odometer: optionalInteger,
});

export type SkipFormValues = z.infer<typeof skipFormSchema>;
