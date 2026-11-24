import { z } from "zod";

import { optionalText, shortText } from "../../../../core/zod-primitives";

export const updateTrainingParams = z.object({ trainingId: z.uuid() });

export const updateTrainingRequest = z.object({
  description: optionalText(2000).optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  name: shortText(80).optional(),
  weekdays: z.array(z.number().int().min(1).max(7)).max(7).optional(),
});
