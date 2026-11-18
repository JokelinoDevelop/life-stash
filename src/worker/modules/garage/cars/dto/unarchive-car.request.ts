import { z } from "zod";

export const unarchiveCarParams = z.object({ carId: z.uuid() });
