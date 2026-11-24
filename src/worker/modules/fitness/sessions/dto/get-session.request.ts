import { z } from "zod";

export const getSessionParams = z.object({ sessionId: z.uuid() });
