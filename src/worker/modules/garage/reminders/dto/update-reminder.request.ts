import { REMINDER_KINDS } from "@shared/domain/garage-kinds";
import { z } from "zod";

import {
  isoDate,
  kilometres,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const updateReminderParams = z.object({ reminderId: z.uuid() });

export const updateReminderRequest = z
  .object({
    dueDate: isoDate.nullable(),
    dueOdometerKm: kilometres.nullable(),
    intervalKm: z.number().int().min(1).max(1_000_000).nullable(),
    intervalMonths: z.number().int().min(1).max(240).nullable(),
    itemId: z.uuid().nullable(),
    kind: z.enum(REMINDER_KINDS),
    notes: optionalText(),
    packageId: z.uuid().nullable(),
    title: shortText(120),
  })
  .refine((value) => value.dueDate !== null || value.dueOdometerKm !== null, {
    message: "Set a due date, a due odometer or both",
    path: ["dueDate"],
  });
