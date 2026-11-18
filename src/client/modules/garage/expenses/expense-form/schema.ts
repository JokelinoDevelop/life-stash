import { EXPENSE_CATEGORIES } from "@shared/domain/garage-kinds";
import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  isoDateField,
  optionalAmount,
  optionalInteger,
  optionalText,
  requiredAmount,
} from "@/lib/form-schemas";

export const expenseFormSchema = z.object({
  amount: requiredAmount,
  category: z.enum(EXPENSE_CATEGORIES),
  currency: z.enum(CURRENCIES),
  date: isoDateField,
  notes: optionalText(1000),
  odometer: optionalInteger,
  quantity: optionalAmount,
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
