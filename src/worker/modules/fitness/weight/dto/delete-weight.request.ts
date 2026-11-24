import { z } from "zod";

export const deleteWeightParams = z.object({ entryId: z.uuid() });
