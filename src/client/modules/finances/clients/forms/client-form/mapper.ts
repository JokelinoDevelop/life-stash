import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
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
  language: InvoiceLanguage;
}): ClientFormValues => ({
  address: "",
  currency: context.currency,
  email: "",
  invoiceLanguage: context.language,
  kind: "client",
  name: "",
  notes: "",
  paymentTermsDays: String(context.termsDays),
  taxId: "",
});

export const clientToFormValues = (
  client: ClientDetailBody["client"]
): ClientFormValues => ({
  address: client.address ?? "",
  currency: client.currency,
  email: client.email ?? "",
  invoiceLanguage: client.invoiceLanguage,
  kind: client.kind,
  name: client.name,
  notes: client.notes ?? "",
  paymentTermsDays: String(client.paymentTermsDays),
  taxId: client.taxId ?? "",
});

export const clientFormToCreateRequest = (
  values: ClientFormValues
): CreateBody => ({
  address: emptyToNull(values.address),
  currency: values.currency,
  email: emptyToNull(values.email),
  invoiceLanguage: values.invoiceLanguage,
  kind: values.kind,
  name: values.name.trim(),
  notes: emptyToNull(values.notes),
  paymentTermsDays: parseInteger(values.paymentTermsDays) ?? 0,
  taxId: emptyToNull(values.taxId),
});

export const clientFormToUpdateRequest = (
  values: ClientFormValues
): UpdateBody => clientFormToCreateRequest(values);

export const CLIENT_SERVER_FIELDS = {
  email: "email",
  name: "name",
} as const satisfies Record<string, keyof ClientFormValues>;
