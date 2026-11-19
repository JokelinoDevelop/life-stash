import { z } from "zod";

export const deleteTransactionParams = z.object({ transactionId: z.uuid() });
