import { z } from "zod";

import { isoDate, optionalText } from "../../../../core/zod-primitives";

/** Touches one weekly occurrence: done / skipped, moved (`date`), note or duration. */
export const putOccurrenceRequest = z.object({
  date: isoDate.optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  note: optionalText(2000).optional(),
  originalDate: isoDate,
  scheduleId: z.uuid(),
  status: z.enum(["planned", "done", "skipped"]).optional(),
});
