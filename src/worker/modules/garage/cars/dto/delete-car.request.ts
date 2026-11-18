import { z } from "zod";

export const deleteCarParams = z.object({ carId: z.uuid() });
