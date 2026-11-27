import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { financeKeys } from "../finance-keys";
import type { OverviewFilter } from "./overview-search";

/** The overview; no filter means all time, every category and client. */
export const overviewQuery = (filter: OverviewFilter = {}) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(api.finances.overview.$get({ query: filter })),
    queryKey: financeKeys.overview(filter),
  });

export type FinanceOverview = SuccessBody<
  Awaited<ReturnType<typeof api.finances.overview.$get>>
>;
