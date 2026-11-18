import { z } from "zod";

export const deleteExpenseParams = z.object({ expenseId: z.uuid() });
