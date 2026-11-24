import { z } from "zod";

export const deleteSessionParams = z.object({ sessionId: z.uuid() });
