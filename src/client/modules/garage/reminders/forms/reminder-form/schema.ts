import { isIsoDate } from "@shared/domain/dates";
import { REMINDER_KINDS } from "@shared/domain/garage-kinds";
import { z } from "zod";

import {
  optionalInteger,
  optionalText,
  requiredText,
} from "@/lib/form-schemas";

export const reminderFormSchema = z
  .object({
    dueDate: z
      .string()
      .refine((value) => value === "" || isIsoDate(value), "validation.date"),
    dueOdometer: optionalInteger,
    intervalKm: optionalInteger,
    intervalMonths: optionalInteger,
    kind: z.enum(REMINDER_KINDS),
    notes: optionalText(),
    title: requiredText(120),
  })
  .refine((value) => value.dueDate !== "" || value.dueOdometer.trim() !== "", {
    message: "validation.required",
    path: ["dueDate"],
  });

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;
