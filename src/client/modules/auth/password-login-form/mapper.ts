import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { PasswordLoginFormValues } from "./schema";

type LoginPasswordBody = InferRequestType<
  typeof api.auth.login.password.$post
>["json"];

export const passwordLoginFormToRequest = (
  values: PasswordLoginFormValues
): LoginPasswordBody => ({
  email: values.email.trim().toLowerCase(),
  password: values.password,
});
