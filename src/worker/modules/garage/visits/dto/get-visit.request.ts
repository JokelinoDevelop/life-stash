import { z } from "zod";

export const getVisitParams = z.object({ visitId: z.uuid() });
