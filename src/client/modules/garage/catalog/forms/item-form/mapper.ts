import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { ItemFormValues } from "./schema";

type ItemBody = InferRequestType<typeof api.garage.items.$post>["json"];

export const itemFormDefaults = (name = ""): ItemFormValues => ({ name });

export const itemFormToRequest = (values: ItemFormValues): ItemBody => ({
  name: values.name.trim(),
});
