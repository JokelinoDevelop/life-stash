import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull } from "@/lib/form-schemas";

import type { InvoiceNotesFormValues } from "./schema";

type UpdateBody = InferRequestType<
  (typeof api.finances.invoices)[":invoiceId"]["$patch"]
>["json"];

export const invoiceNotesToFormValues = (invoice: {
  notes: string | null;
}): InvoiceNotesFormValues => ({ notes: invoice.notes ?? "" });

/** Issued invoices only take notes. */
export const invoiceNotesFormToRequest = (
  values: InvoiceNotesFormValues
): UpdateBody => ({ notes: emptyToNull(values.notes) });
