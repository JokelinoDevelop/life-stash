import { z } from "zod";

export const listExpensesQuery = z.object({
  carId: z.uuid(),
  year: z
    .string()
    .regex(/^\d{4}$/u)
    .optional()
    .transform((value) => (value === undefined ? null : Number(value))),
});
