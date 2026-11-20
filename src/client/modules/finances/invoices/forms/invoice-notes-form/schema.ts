import { z } from "zod";

import { optionalText } from "@/lib/form-schemas";

export const invoiceNotesFormSchema = z.object({
  notes: optionalText(2000),
});

export type InvoiceNotesFormValues = z.infer<typeof invoiceNotesFormSchema>;
