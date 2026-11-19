import { z } from "zod";

export const listInvoicesQuery = z.object({
  clientId: z
    .uuid()
    .optional()
    .transform((value) => value ?? null),
  status: z.enum(["all", "unpaid", "paid"]).default("all"),
  year: z.coerce.number().int().min(1990).max(2200).optional(),
});
