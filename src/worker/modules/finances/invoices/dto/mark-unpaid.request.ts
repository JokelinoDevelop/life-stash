import { z } from "zod";

export const markUnpaidParams = z.object({ invoiceId: z.uuid() });
