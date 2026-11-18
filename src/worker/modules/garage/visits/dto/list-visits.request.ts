import { z } from "zod";

export const listVisitsQuery = z.object({ carId: z.uuid() });
