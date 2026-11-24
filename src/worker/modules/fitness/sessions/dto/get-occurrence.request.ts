import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

export const getOccurrenceQuery = z.object({
  originalDate: isoDate,
  scheduleId: z.uuid(),
});
