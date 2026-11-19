import { z } from "zod";

export const deleteRecurringParams = z.object({ recurringId: z.uuid() });
