import { z } from "zod";

export const skipRecurringParams = z.object({ recurringId: z.uuid() });
