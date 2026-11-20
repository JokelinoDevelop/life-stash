import { z } from "zod";

export const nextInvoiceNumberQuery = z.object({
  /** The issue year; this year by default. */
  year: z.coerce.number().int().min(1990).max(2200).optional(),
});
