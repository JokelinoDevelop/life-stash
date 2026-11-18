import { z } from "zod";

export const carSpendingParams = z.object({ carId: z.uuid() });
