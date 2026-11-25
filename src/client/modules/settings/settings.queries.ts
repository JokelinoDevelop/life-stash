import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import { hasPushSubscription } from "@/lib/push";
import { queryKeys } from "@/lib/query-keys";

/** Email, whether a password is set, recent sign-in, passkey count. */
export const credentialsQuery = queryOptions({
  queryFn: async () => await unwrap(api.account.credentials.$get()),
  queryKey: queryKeys.credentials,
});

export const passkeysQuery = queryOptions({
  queryFn: async () => await unwrap(api.account.passkeys.$get()),
  queryKey: queryKeys.passkeys,
});

export const recoveryCodesQuery = queryOptions({
  queryFn: async () => await unwrap(api.account["recovery-codes"].$get()),
  queryKey: queryKeys.recoveryCodes,
});

/** Whether this device (browser) has a push subscription; false where push isn't supported. */
export const pushSubscriptionQuery = queryOptions({
  queryFn: hasPushSubscription,
  queryKey: ["settings", "push-subscription"] as const,
});
