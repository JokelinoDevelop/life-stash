import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { financeKeys } from "../finance-keys";

export const clientsQuery = (year: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(
        api.finances.clients.$get({ query: { year: String(year) } })
      ),
    queryKey: financeKeys.clients(year),
  });

export const clientQuery = (clientId: string, year: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(
        api.finances.clients[":clientId"].$get({
          param: { clientId },
          query: { year: String(year) },
        })
      ),
    queryKey: financeKeys.client(clientId, year),
  });

export type ClientListItem = SuccessBody<
  Awaited<ReturnType<typeof api.finances.clients.$get>>
>["clients"][number];

export type ClientDetailBody = SuccessBody<
  Awaited<ReturnType<(typeof api.finances.clients)[":clientId"]["$get"]>>
>;
