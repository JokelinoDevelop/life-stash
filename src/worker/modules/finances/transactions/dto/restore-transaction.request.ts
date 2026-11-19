import { z } from "zod";

export const restoreTransactionParams = z.object({ transactionId: z.uuid() });
