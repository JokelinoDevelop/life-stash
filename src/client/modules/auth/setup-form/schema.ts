import { z } from "zod";

import { requiredText } from "@/lib/form-schemas";

export const setupFormSchema = z.object({
  displayName: requiredText(60),
});

export type SetupFormValues = z.infer<typeof setupFormSchema>;

export const setupFormDefaults: SetupFormValues = { displayName: "" };
