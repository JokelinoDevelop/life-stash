import { z } from "zod";

export const getTransactionParams = z.object({ transactionId: z.uuid() });
