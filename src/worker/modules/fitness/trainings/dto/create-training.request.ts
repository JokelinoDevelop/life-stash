import { z } from "zod";

import { optionalText, shortText } from "../../../../core/zod-primitives";

export const createTrainingRequest = z.object({
  description: optionalText(2000),
  durationMinutes: z.number().int().min(1).max(1440).nullable(),
  name: shortText(80),
  weekdays: z.array(z.number().int().min(1).max(7)).max(7),
});
