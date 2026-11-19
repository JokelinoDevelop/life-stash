import { CATEGORY_ICONS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import { requiredText } from "@/lib/form-schemas";

export const categoryFormSchema = z.object({
  icon: z.enum(CATEGORY_ICONS),
  name: requiredText(60),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
