import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { PasswordSetupFormValues } from "./schema";

type SetupPasswordBody = InferRequestType<
  typeof api.auth.setup.password.$post
>["json"];

export const passwordSetupFormToRequest = (
  values: PasswordSetupFormValues
): SetupPasswordBody => ({
  displayName: values.displayName.trim(),
  email: values.email.trim().toLowerCase(),
  password: values.password,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});
