import { z } from "zod";

import { optionalText, requiredText } from "@/lib/form-schemas";

export const projectFormSchema = z.object({
  name: requiredText(120),
  notes: optionalText(2000),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
