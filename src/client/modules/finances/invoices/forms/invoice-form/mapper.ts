import {
  addDays,
  addMonths,
  addMonthsKeepingMonthEnd,
} from "@shared/domain/dates";
import {
  BASIS_POINTS,
  QUANTITY_SCALE,
  invoiceTotals,
  lineAmounts,
} from "@shared/domain/finances/invoice-document";
import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
import { defaultDueDate } from "@shared/domain/finances/invoices";
import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseAmount } from "@/lib/form-schemas";

import type { InvoiceDetail } from "../../invoices.queries";
import type { InvoiceFormLine, InvoiceFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.finances.invoices.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.invoices)[":invoiceId"]["$patch"]
>["json"];

/** The select value for "no period" / "no project". */
export const NO_PERIOD = "none";

const PERCENT = 100;

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
  address: string | null;
  taxId: string | null;
  email: string | null;
  invoiceLanguage: InvoiceLanguage;
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

const decimal = (value: string): number =>
  Number(value.replaceAll(/\s/gu, "").replace(",", "."));

/** "1,5" → 1500 thousandths (0 while it isn't a number yet). */
export const parseQuantity = (value: string): number => {
  const milli = Math.round(decimal(value) * QUANTITY_SCALE);

  return Number.isFinite(milli) ? milli : 0;
};

/** "18" / "5,5" → basis points (empty is 0). */
export const parseVatRate = (value: string): number =>
  value.trim() === ""
    ? 0
    : Math.round(decimal(value) * (BASIS_POINTS / PERCENT));

const formatRate = (bp: number): string =>
  bp === 0 ? "" : String(bp / (BASIS_POINTS / PERCENT));

/** A blank line: one of something, at the default VAT rate. */
export const newInvoiceLine = (defaultVatRateBp: number): InvoiceFormLine => ({
  description: "",
  key: crypto.randomUUID(),
  quantity: "1",
  unit: "",
  unitPrice: "",
  vatRate: formatRate(defaultVatRateBp),
});

export const invoiceFormDefaults = (context: {
  client?: InvoiceClientOption;
  currency: Currency;
  today: string;
  termsDays: number;
  defaultVatRateBp?: number;
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
  lines: [newInvoiceLine(context.defaultVatRateBp ?? 0)],
  mode: "itemised",
  notes: "",
  number: "",
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
  lines: invoice.lines.map((line) => ({
    description: line.description,
    key: line.id,
    quantity: String(line.quantityMilli / QUANTITY_SCALE),
    unit: line.unit ?? "",
    unitPrice: String(toMajor(line.unitPriceMinor)),
    vatRate: formatRate(line.vatRateBp),
  })),
  mode: invoice.itemised ? "itemised" : "recorded",
  notes: invoice.notes ?? "",
  number: "",
  period: invoice.periodStart?.slice(0, 7) ?? NO_PERIOD,
  projectId: invoice.projectId ?? NO_PERIOD,
});

/**
 * "Duplicate for next month": a new draft one month on (period, issue and due dates), with
 * the same lines and units. It gets its number when issued. Files are not copied.
 */
export const duplicateToFormValues = (
  invoice: InvoiceDetail
): InvoiceFormValues => {
  const values = invoiceToFormValues(invoice);

  return {
    ...values,
    dueDate: addMonthsKeepingMonthEnd(invoice.dueDate, 1),
    issueDate: addMonthsKeepingMonthEnd(invoice.issueDate, 1),
    lines: values.lines.map((line) => ({ ...line, key: crypto.randomUUID() })),
    period:
      values.period === NO_PERIOD
        ? NO_PERIOD
        : addMonths(`${values.period}-01`, 1).slice(0, 7),
  };
};

/** The lines in API units (thousandths, minor units, basis points). */
const linesToRequest = (lines: readonly InvoiceFormLine[]) =>
  lines.map((line) => ({
    description: line.description.trim(),
    quantityMilli: parseQuantity(line.quantity),
    unit: emptyToNull(line.unit),
    unitPrice: line.unitPrice,
    unitPriceMinor: toMinor(parseAmount(line.unitPrice) ?? 0),
    vatRateBp: parseVatRate(line.vatRate),
  }));

/** Line amounts and totals as the server will compute them (for the editor and preview). */
export const formLineTotals = (
  lines: readonly InvoiceFormLine[],
  vatRegistered: boolean
) => {
  const priced = linesToRequest(lines).map((line, index) => {
    const vatRateBp = vatRegistered ? line.vatRateBp : 0;

    return {
      ...line,
      ...lineAmounts({ ...line, vatRateBp }),
      key: lines[index]?.key ?? String(index),
      vatRateBp,
    };
  });

  return { lines: priced, totals: invoiceTotals(priced) };
};

const toBody = (values: InvoiceFormValues) => {
  const bounds = periodBounds(values.period);
  const itemised = values.mode === "itemised";

  return {
    amountMinor: itemised ? 0 : toMinor(parseAmount(values.amount) ?? 0),
    clientId: values.clientId,
    currency: values.currency,
    description: emptyToNull(values.description),
    dueDate: values.dueDate,
    issueDate: values.issueDate,
    lines: itemised
      ? linesToRequest(values.lines).map(
          ({ unitPrice: _typed, ...line }) => line
        )
      : [],
    notes: emptyToNull(values.notes),
    periodEnd: bounds?.end ?? null,
    periodStart: bounds?.start ?? null,
    projectId: values.projectId === NO_PERIOD ? null : values.projectId,
  };
};

/** The typed number to issue with; null takes the next one (and drafts send none). */
const numberFor = (values: InvoiceFormValues, issue: boolean) =>
  issue ? emptyToNull(values.number) : null;

export const invoiceFormToCreateRequest = (
  values: InvoiceFormValues,
  issue: boolean
): CreateBody => ({
  ...toBody(values),
  issue,
  number: numberFor(values, issue),
});

export const invoiceFormToUpdateRequest = (
  values: InvoiceFormValues,
  issue: boolean
): UpdateBody => invoiceFormToCreateRequest(values, issue);

/** API field → form field for errors the server pins on a field. */
export const INVOICE_SERVER_FIELDS = {
  amountMinor: "amount",
  clientId: "clientId",
  number: "number",
} as const satisfies Record<string, keyof InvoiceFormValues>;

/** Shape-only defaults for `withForm` sections. */
export const INVOICE_FORM_TEMPLATE: InvoiceFormValues = invoiceFormDefaults({
  currency: "EUR",
  termsDays: 30,
  today: "2000-01-01",
});
