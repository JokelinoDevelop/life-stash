import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { financeKeys } from "../finance-keys";

export const categoriesQuery = queryOptions({
  queryFn: async () => await unwrap(api.finances.categories.$get()),
  queryKey: financeKeys.categories,
  staleTime: 60_000,
});

export type FinanceCategory = SuccessBody<
  Awaited<ReturnType<typeof api.finances.categories.$get>>
>["categories"][number];
