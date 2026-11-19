import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseInteger } from "@/lib/form-schemas";

import type { ClientDetailBody } from "../../clients.queries";
import type { ClientFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.finances.clients.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.clients)[":clientId"]["$patch"]
>["json"];

export const clientFormDefaults = (context: {
  currency: Currency;
  termsDays: number;
}): ClientFormValues => ({
  currency: context.currency,
  email: "",
  kind: "client",
  name: "",
  notes: "",
  paymentTermsDays: String(context.termsDays),
});

export const clientToFormValues = (
  client: ClientDetailBody["client"]
): ClientFormValues => ({
  currency: client.currency,
  email: client.email ?? "",
  kind: client.kind,
  name: client.name,
  notes: client.notes ?? "",
  paymentTermsDays: String(client.paymentTermsDays),
});

export const clientFormToCreateRequest = (
  values: ClientFormValues
): CreateBody => ({
  currency: values.currency,
  email: emptyToNull(values.email),
  kind: values.kind,
  name: values.name.trim(),
  notes: emptyToNull(values.notes),
  paymentTermsDays: parseInteger(values.paymentTermsDays) ?? 0,
});

export const clientFormToUpdateRequest = (
  values: ClientFormValues
): UpdateBody => clientFormToCreateRequest(values);

export const CLIENT_SERVER_FIELDS = {
  email: "email",
  name: "name",
} as const satisfies Record<string, keyof ClientFormValues>;
