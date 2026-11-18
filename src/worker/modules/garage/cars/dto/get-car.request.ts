import { z } from "zod";

export const getCarParams = z.object({ carId: z.uuid() });
