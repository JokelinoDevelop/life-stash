import { z } from "zod";

import {
  optionalInteger,
  optionalText,
  parseInteger,
  requiredText,
} from "@/lib/form-schemas";

const MAX_MINUTES = 1440;

export const trainingFormSchema = z.object({
  description: optionalText(2000),
  durationMinutes: optionalInteger.refine((value) => {
    const minutes = parseInteger(value);

    return minutes === null || (minutes >= 1 && minutes <= MAX_MINUTES);
  }, "validation.number"),
  name: requiredText(80),
  /** ISO weekdays as strings ("1" = Monday); empty = no weekly repeat. */
  weekdays: z.array(z.string()),
});

export type TrainingFormValues = z.infer<typeof trainingFormSchema>;
