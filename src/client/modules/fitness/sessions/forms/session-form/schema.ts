import { z } from "zod";

import {
  isoDateField,
  optionalInteger,
  optionalText,
  parseInteger,
} from "@/lib/form-schemas";

/** `trainingId` value for a free-form session (named by `title`). */
export const OTHER_TRAINING = "other";

const MAX_MINUTES = 1440;

export const SESSION_FORM_STATUSES = ["planned", "done", "skipped"] as const;

export const sessionFormSchema = z
  .object({
    date: isoDateField,
    durationMinutes: optionalInteger.refine((value) => {
      const minutes = parseInteger(value);

      return minutes === null || (minutes >= 1 && minutes <= MAX_MINUTES);
    }, "validation.number"),
    note: optionalText(2000),
    status: z.enum(SESSION_FORM_STATUSES),
    title: z.string().max(80),
    trainingId: z.string().min(1, "validation.required"),
  })
  .refine(
    (values) =>
      values.trainingId !== OTHER_TRAINING || values.title.trim() !== "",
    { message: "validation.required", path: ["title"] }
  );

export type SessionFormValues = z.infer<typeof sessionFormSchema>;
