import { z } from "zod";

export const restoreTrainingParams = z.object({ trainingId: z.uuid() });
