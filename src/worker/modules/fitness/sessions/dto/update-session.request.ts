import { z } from "zod";

import { isoDate, optionalText } from "../../../../core/zod-primitives";

export const updateSessionParams = z.object({ sessionId: z.uuid() });

export const updateSessionRequest = z.object({
  date: isoDate.optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  note: optionalText(2000).optional(),
  status: z.enum(["planned", "done", "skipped"]).optional(),
  title: optionalText(80).optional(),
  trainingId: z.uuid().nullable().optional(),
});
