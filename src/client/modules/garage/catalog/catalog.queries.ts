import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

export const catalogItemsQuery = (includeArchived: boolean) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.items.$get({
          query: { includeArchived: includeArchived ? "true" : "false" },
        })
      ),
    queryKey: ["garage", "catalog", "items", { includeArchived }] as const,
  });

export const catalogPackagesQuery = queryOptions({
  queryFn: async () => await unwrap(api.garage.packages.$get()),
  queryKey: ["garage", "catalog", "packages"] as const,
});

export type CatalogItem = SuccessBody<
  Awaited<ReturnType<typeof api.garage.items.$get>>
>["items"][number];

export type CatalogPackage = SuccessBody<
  Awaited<ReturnType<typeof api.garage.packages.$get>>
>["packages"][number];
