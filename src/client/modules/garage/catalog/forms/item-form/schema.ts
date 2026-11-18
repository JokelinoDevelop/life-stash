import { z } from "zod";

import { requiredText } from "@/lib/form-schemas";

export const itemFormSchema = z.object({ name: requiredText(80) });

export type ItemFormValues = z.infer<typeof itemFormSchema>;
