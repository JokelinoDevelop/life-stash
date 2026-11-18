import { z } from "zod";

export const listMileageQuery = z.object({ carId: z.uuid() });
