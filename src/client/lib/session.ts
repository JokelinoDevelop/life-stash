import { queryOptions, useQuery } from "@tanstack/react-query";

import { api, unwrap } from "./api";
import { queryKeys } from "./query-keys";

export const authStatusQuery = queryOptions({
  queryFn: async () => await unwrap(api.auth.status.$get()),
  queryKey: queryKeys.authStatus,
  staleTime: 60_000,
});

export const configQuery = queryOptions({
  queryFn: async () => await unwrap(api.config.$get()),
  queryKey: queryKeys.config,
  staleTime: Number.POSITIVE_INFINITY,
});

export const preferencesQuery = queryOptions({
  queryFn: async () => await unwrap(api.settings.preferences.$get()),
  queryKey: queryKeys.preferences,
  staleTime: 5 * 60_000,
});

export const useConfig = () => useQuery(configQuery);

export const usePreferences = () => useQuery(preferencesQuery);
