import { z } from "zod";

export const itemHistoryQuery = z.object({ carId: z.uuid() });
