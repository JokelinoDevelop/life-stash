import { z } from "zod";

export const exportCsvQuery = z.object({
  type: z.enum(["transactions", "invoices"]),
  year: z.coerce.number().int().min(1990).max(2200),
});
