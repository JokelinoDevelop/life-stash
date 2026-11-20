import { queryOptions } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";

export const businessProfileQuery = queryOptions({
  queryFn: async () => await unwrap(api.finances["business-profile"].$get()),
  queryKey: financeKeys.businessProfile,
  staleTime: 5 * 60_000,
});

export type BusinessProfile = NonNullable<
  SuccessBody<
    Awaited<ReturnType<(typeof api.finances)["business-profile"]["$get"]>>
  >["profile"]
>;

type SaveBody = InferRequestType<
  (typeof api.finances)["business-profile"]["$put"]
>["json"];

export const useSaveBusinessProfile = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: SaveBody) =>
      await unwrap(api.finances["business-profile"].$put({ json })),
    success: t("profile.saved"),
  });
};
