import { z } from "zod";

export const deleteProjectParams = z.object({ projectId: z.uuid() });
