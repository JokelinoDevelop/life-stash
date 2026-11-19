import { z } from "zod";

export const financeOverviewQuery = z.object({
  year: z.coerce.number().int().min(1990).max(2200).optional(),
});
