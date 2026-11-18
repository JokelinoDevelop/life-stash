import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

export const mileageQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(api.garage.mileage.$get({ query: { carId } })),
    queryKey: ["garage", "mileage", carId] as const,
  });

export type MileagePoint = SuccessBody<
  Awaited<ReturnType<typeof api.garage.mileage.$get>>
>["points"][number];
