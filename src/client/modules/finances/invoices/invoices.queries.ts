import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { financeKeys } from "../finance-keys";

export type InvoiceStatusFilter = "all" | "unpaid" | "paid";

export interface InvoiceFilter {
  status: InvoiceStatusFilter;
  clientId?: string;
  year: number;
}

export const invoicesQuery = (filter: InvoiceFilter) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(
        api.finances.invoices.$get({
          query: {
            clientId: filter.clientId,
            status: filter.status,
            year: String(filter.year),
          },
        })
      ),
    queryKey: financeKeys.invoices(filter),
  });

export const invoiceQuery = (invoiceId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.finances.invoices[":invoiceId"].$get({ param: { invoiceId } })
      ),
    queryKey: financeKeys.invoice(invoiceId),
  });

export const nextInvoiceNumberQuery = queryOptions({
  queryFn: async () =>
    await unwrap(api.finances.invoices["next-number"].$get()),
  queryKey: financeKeys.nextInvoiceNumber,
  staleTime: 0,
});

export type InvoiceList = SuccessBody<
  Awaited<ReturnType<typeof api.finances.invoices.$get>>
>;

export type InvoiceListItem = InvoiceList["invoices"][number];

export type InvoiceDetail = SuccessBody<
  Awaited<ReturnType<(typeof api.finances.invoices)[":invoiceId"]["$get"]>>
>["invoice"];
