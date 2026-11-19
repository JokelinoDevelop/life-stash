import type { MoneyTotal } from "@shared/domain/money";
import { sumByCurrency } from "@shared/domain/money";

export type InvoiceGroupKey = "overdue" | "sent" | "draft" | "paid" | "void";

export const INVOICE_GROUP_ORDER: readonly InvoiceGroupKey[] = [
  "overdue",
  "sent",
  "draft",
  "paid",
  "void",
];

export interface InvoiceGroup<Row> {
  key: InvoiceGroupKey;
  rows: Row[];
  total: MoneyTotal[];
}

/** Groups invoices by status (Overdue · Sent · Draft · Paid · Void), each with its total. */
export const groupInvoices = <
  Row extends {
    status: InvoiceGroupKey;
    amountMinor: number;
    currency: MoneyTotal["currency"];
  },
>(
  rows: readonly Row[]
): InvoiceGroup<Row>[] => {
  const groups = new Map<InvoiceGroupKey, Row[]>();

  for (const row of rows) {
    groups.set(row.status, [...(groups.get(row.status) ?? []), row]);
  }

  return INVOICE_GROUP_ORDER.flatMap((key) => {
    const list = groups.get(key);

    return list === undefined
      ? []
      : [{ key, rows: list, total: sumByCurrency(list) }];
  });
};
