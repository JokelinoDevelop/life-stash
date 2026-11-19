import { z } from "zod";

export const markSentParams = z.object({ invoiceId: z.uuid() });
