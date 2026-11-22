import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { ReauthFormValues } from "./schema";

type LoginPasswordBody = InferRequestType<
  typeof api.auth.login.password.$post
>["json"];

/** Signing in again with your own email and the typed password. */
export const reauthFormToRequest = (
  values: ReauthFormValues,
  email: string
): LoginPasswordBody => ({ email, password: values.password });
