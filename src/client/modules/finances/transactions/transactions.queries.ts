import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { financeKeys } from "../finance-keys";
import type { TransactionFilter } from "./transaction-filter";

/** Rows per page; matches the API (`TRANSACTIONS_PAGE_SIZE` in the worker). */
export const TRANSACTIONS_PAGE_SIZE = 25;

export type TransactionPage = SuccessBody<
  Awaited<ReturnType<typeof api.finances.transactions.$get>>
>;

export type TransactionListItem = TransactionPage["transactions"][number];

export type TransactionMonth = TransactionPage["months"][number];

/** Newest first, a page at a time (pager); the first page carries totals and month bands. */
export const transactionsQuery = (filter: TransactionFilter) =>
  infiniteQueryOptions({
    getNextPageParam: (last: TransactionPage) => last.nextCursor ?? undefined,
    // SAFETY: widening, not narrowing: the first page has no cursor, later ones a string.
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) =>
      await unwrap(
        api.finances.transactions.$get({
          query: { ...filter, cursor: pageParam },
        })
      ),
    queryKey: financeKeys.transactions(filter),
  });

export const transactionQuery = (transactionId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.finances.transactions[":transactionId"].$get({
          param: { transactionId },
        })
      ),
    queryKey: financeKeys.transaction(transactionId),
  });

export type TransactionDetail = SuccessBody<
  Awaited<
    ReturnType<(typeof api.finances.transactions)[":transactionId"]["$get"]>
  >
>["transaction"];
