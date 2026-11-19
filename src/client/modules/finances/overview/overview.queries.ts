import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { financeKeys } from "../finance-keys";

export const overviewQuery = (year: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(
        api.finances.overview.$get({ query: { year: String(year) } })
      ),
    queryKey: financeKeys.overview(year),
  });

export type FinanceOverview = SuccessBody<
  Awaited<ReturnType<typeof api.finances.overview.$get>>
>;
