import { CURRENCIES } from "@shared/domain/money";
import { DISTANCE_UNITS } from "@shared/domain/units";
import { z } from "zod";

import { requiredInteger, requiredText } from "@/lib/form-schemas";

export const preferencesFormSchema = z.object({
  currency: z.enum(CURRENCIES),
  displayName: requiredText(60),
  distanceUnit: z.enum(DISTANCE_UNITS),
  locale: z.enum(["en", "mk"]),
  odometerNudgeWeeks: requiredInteger,
  timeZone: requiredText(64),
});

export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;
