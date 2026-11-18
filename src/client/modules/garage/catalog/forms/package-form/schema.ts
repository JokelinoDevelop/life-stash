import { z } from "zod";

import { optionalText, requiredText } from "@/lib/form-schemas";

export const packageFormSchema = z.object({
  itemIds: z.array(z.string()),
  name: requiredText(80),
  notes: optionalText(),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;
