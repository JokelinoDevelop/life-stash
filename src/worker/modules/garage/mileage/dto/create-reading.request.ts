import { z } from "zod";

import {
  isoDate,
  kilometres,
  optionalText,
} from "../../../../core/zod-primitives";

export const createReadingRequest = z.object({
  carId: z.uuid(),
  date: isoDate,
  notes: optionalText(500),
  odometerKm: kilometres,
});
