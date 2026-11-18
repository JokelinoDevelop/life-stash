import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

export const visitsQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(api.garage.visits.$get({ query: { carId } })),
    queryKey: ["garage", "visits", "list", carId] as const,
  });

export const visitQuery = (visitId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(api.garage.visits[":visitId"].$get({ param: { visitId } })),
    queryKey: ["garage", "visits", "detail", visitId] as const,
  });

export const itemHistoryQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.visits["item-history"].$get({ query: { carId } })
      ),
    queryKey: ["garage", "visits", "item-history", carId] as const,
  });

export type VisitListItem = SuccessBody<
  Awaited<ReturnType<typeof api.garage.visits.$get>>
>["visits"][number];

export type VisitDetail = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.visits)[":visitId"]["$get"]>>
>["visit"];
