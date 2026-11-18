import { z } from "zod";

export const getReminderParams = z.object({ reminderId: z.uuid() });
