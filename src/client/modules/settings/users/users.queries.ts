import { queryOptions } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";

import { api, unwrap } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export type AdminUser = InferResponseType<
  typeof api.admin.users.$get,
  200
>["users"][number];

export type PendingInvite = InferResponseType<
  typeof api.admin.invites.$get,
  200
>["invites"][number];

export const adminUsersQuery = queryOptions({
  queryFn: async () => await unwrap(api.admin.users.$get()),
  queryKey: queryKeys.adminUsers,
});

export const adminInvitesQuery = queryOptions({
  queryFn: async () => await unwrap(api.admin.invites.$get()),
  queryKey: queryKeys.adminInvites,
});
