import { z } from "zod";

export const deleteVisitParams = z.object({ visitId: z.uuid() });
