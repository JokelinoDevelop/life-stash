import { queryOptions } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";

export const financeSettingsQuery = queryOptions({
  queryFn: async () => await unwrap(api.finances.settings.$get()),
  queryKey: financeKeys.settings,
  staleTime: 5 * 60_000,
});

type UpdateBody = InferRequestType<typeof api.finances.settings.$patch>["json"];

export const useUpdateFinanceSettings = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: UpdateBody) =>
      await unwrap(api.finances.settings.$patch({ json })),
    success: t("defaults.saved"),
  });
};
