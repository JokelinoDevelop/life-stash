import { z } from "zod";

import { emailField } from "@/lib/form-schemas";

export const passwordLoginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "validation.required"),
});

export type PasswordLoginFormValues = z.infer<typeof passwordLoginFormSchema>;

export const passwordLoginFormDefaults: PasswordLoginFormValues = {
  email: "",
  password: "",
};
