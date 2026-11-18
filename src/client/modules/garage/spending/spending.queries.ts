import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

export const carSpendingQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.spending.cars[":carId"].$get({ param: { carId } })
      ),
    queryKey: ["garage", "spending", carId] as const,
  });

export const householdSpendingQuery = queryOptions({
  queryFn: async () => await unwrap(api.garage.spending.$get()),
  queryKey: ["garage", "spending", "household"] as const,
});

export type CarSpendingYear = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.spending.cars)[":carId"]["$get"]>>
>["years"][number];
