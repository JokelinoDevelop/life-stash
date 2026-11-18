import { z } from "zod";

export const carOverviewParams = z.object({ carId: z.uuid() });
