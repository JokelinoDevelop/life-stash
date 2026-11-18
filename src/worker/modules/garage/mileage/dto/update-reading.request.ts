import { z } from "zod";

import {
  isoDate,
  kilometres,
  optionalText,
} from "../../../../core/zod-primitives";

export const updateReadingParams = z.object({ readingId: z.uuid() });

export const updateReadingRequest = z.object({
  date: isoDate,
  notes: optionalText(500),
  odometerKm: kilometres,
});
