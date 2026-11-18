import { z } from "zod";

export const listRemindersQuery = z.object({ carId: z.uuid() });
