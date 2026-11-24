import { z } from "zod";

import { isoDate, optionalText } from "../../../../core/zod-primitives";

export const createSessionRequest = z.object({
  date: isoDate,
  durationMinutes: z.number().int().min(1).max(1440).nullable(),
  note: optionalText(2000),
  status: z.enum(["planned", "done", "skipped"]),
  /** Free-form name when there is no training. */
  title: optionalText(80),
  trainingId: z.uuid().nullable(),
});
