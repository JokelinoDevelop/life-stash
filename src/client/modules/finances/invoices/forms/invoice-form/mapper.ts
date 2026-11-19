import { addDays, addMonths } from "@shared/domain/dates";
import { defaultDueDate } from "@shared/domain/finances/invoices";
import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseAmount } from "@/lib/form-schemas";

import type { InvoiceDetail } from "../../invoices.queries";
import type { InvoiceFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.finances.invoices.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.invoices)[":invoiceId"]["$patch"]
>["json"];

/** The select value for "no period" / "no project". */
export const NO_PERIOD = "none";

export interface InvoiceProjectOption {
  id: string;
  clientId: string;
  name: string;
  status: "active" | "done";
}

export interface InvoiceClientOption {
  id: string;
  name: string;
  currency: Currency;
  paymentTermsDays: number;
}

/** `YYYY-MM` → first and last day of that month. */
export const periodBounds = (
  period: string
): { start: string; end: string } | null => {
  if (!/^\d{4}-\d{2}$/u.test(period)) {
    return null;
  }

  const start = `${period}-01`;

  return { end: addDays(addMonths(start, 1), -1), start };
};

export const invoiceFormDefaults = (context: {
  client?: InvoiceClientOption;
  currency: Currency;
  number: string;
  today: string;
  termsDays: number;
}): InvoiceFormValues => ({
  amount: "",
  clientId: context.client?.id ?? "",
  currency: context.client?.currency ?? context.currency,
  description: "",
  dueDate: defaultDueDate(
    context.today,
    context.client?.paymentTermsDays ?? context.termsDays
  ),
  issueDate: context.today,
  notes: "",
  number: context.number,
  period: context.today.slice(0, 7),
  projectId: NO_PERIOD,
});

export const invoiceToFormValues = (
  invoice: InvoiceDetail
): InvoiceFormValues => ({
  amount: String(toMajor(invoice.amountMinor)),
  clientId: invoice.clientId,
  currency: invoice.currency,
  description: invoice.description ?? "",
  dueDate: invoice.dueDate,
  issueDate: invoice.issueDate,
  notes: invoice.notes ?? "",
  number: invoice.number,
  period: invoice.periodStart?.slice(0, 7) ?? NO_PERIOD,
  projectId: invoice.projectId ?? NO_PERIOD,
});

/**
 * "Duplicate for next month": the same invoice one month on (period, issue and due dates),
 * with the next free number. Files are not copied.
 */
export const duplicateToFormValues = (
  invoice: InvoiceDetail,
  number: string
): InvoiceFormValues => {
  const values = invoiceToFormValues(invoice);

  return {
    ...values,
    dueDate: addMonths(invoice.dueDate, 1),
    issueDate: addMonths(invoice.issueDate, 1),
    number,
    period:
      values.period === NO_PERIOD
        ? NO_PERIOD
        : addMonths(`${values.period}-01`, 1).slice(0, 7),
  };
};

const toBody = (values: InvoiceFormValues) => {
  const bounds = periodBounds(values.period);

  return {
    amountMinor: toMinor(parseAmount(values.amount) ?? 0),
    clientId: values.clientId,
    currency: values.currency,
    description: emptyToNull(values.description),
    dueDate: values.dueDate,
    issueDate: values.issueDate,
    notes: emptyToNull(values.notes),
    number: values.number.trim(),
    periodEnd: bounds?.end ?? null,
    periodStart: bounds?.start ?? null,
    projectId: values.projectId === NO_PERIOD ? null : values.projectId,
  };
};

export const invoiceFormToCreateRequest = (
  values: InvoiceFormValues,
  markSent: boolean
): CreateBody => ({ ...toBody(values), markSent });

export const invoiceFormToUpdateRequest = (
  values: InvoiceFormValues,
  markSent: boolean
): UpdateBody => ({ ...toBody(values), markSent });

/** API field → form field for errors the server pins on a field. */
export const INVOICE_SERVER_FIELDS = {
  amountMinor: "amount",
  clientId: "clientId",
  number: "number",
} as const satisfies Record<string, keyof InvoiceFormValues>;

/** Shape-only defaults for `withForm` sections. */
export const INVOICE_FORM_TEMPLATE: InvoiceFormValues = invoiceFormDefaults({
  currency: "EUR",
  number: "",
  termsDays: 30,
  today: "2000-01-01",
});
