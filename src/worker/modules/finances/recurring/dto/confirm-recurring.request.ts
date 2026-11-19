import { z } from "zod";

export const confirmRecurringParams = z.object({ recurringId: z.uuid() });
