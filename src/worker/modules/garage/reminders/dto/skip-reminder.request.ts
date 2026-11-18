import { z } from "zod";

import { isoDate, kilometres } from "../../../../core/zod-primitives";

export const skipReminderParams = z.object({ reminderId: z.uuid() });

export const skipReminderRequest = z.object({
  date: isoDate,
  odometerKm: kilometres.nullable(),
});
