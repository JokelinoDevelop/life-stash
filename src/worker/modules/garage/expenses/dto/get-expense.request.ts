import { z } from "zod";

export const getExpenseParams = z.object({ expenseId: z.uuid() });
