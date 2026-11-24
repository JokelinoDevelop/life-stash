import { z } from "zod";

export const archiveTrainingParams = z.object({ trainingId: z.uuid() });
