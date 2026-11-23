import { queryOptions } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { optimisticUpdate, useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";
import { useLedgerMoney } from "../money";
import type { FinanceOverview } from "../overview/overview.queries";

export const recurringQuery = queryOptions({
  queryFn: async () => await unwrap(api.finances.recurring.$get()),
  queryKey: financeKeys.recurring,
});

export type RecurringItem = SuccessBody<
  Awaited<ReturnType<typeof api.finances.recurring.$get>>
>["recurring"][number];

type CreateBody = InferRequestType<typeof api.finances.recurring.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.recurring)[":recurringId"]["$patch"]
>["json"];

const recurringApi = api.finances.recurring[":recurringId"];

export const useCreateRecurring = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.recurring.$post({ json })),
    success: t("recurring.created"),
  });
};

export const useUpdateRecurring = (success: string | false) =>
  useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async ({ id, json }: { id: string; json: UpdateBody }) =>
      await unwrap(recurringApi.$patch({ json, param: { recurringId: id } })),
    success,
  });

export const useDeleteRecurring = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (id: string) =>
      await unwrap(recurringApi.$delete({ param: { recurringId: id } })),
    success: t("recurring.deleted"),
  });
};

interface PendingRef {
  id: string;
  description: string;
  amountMinor: number;
  currency: "MKD" | "EUR" | "USD";
}

/** Confirming or skipping takes the item off "To confirm" straight away. */
const dropFromToConfirm = optimisticUpdate<FinanceOverview, PendingRef>(
  financeKeys.overviewAll,
  (overview, item) => ({
    ...overview,
    toConfirm: overview.toConfirm.filter((entry) => entry.id !== item.id),
  })
);

export const useConfirmRecurring = () => {
  const { t } = useTranslation("finances");
  const ledger = useLedgerMoney();

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (item: PendingRef) =>
      await unwrap(
        recurringApi.confirm.$post({ param: { recurringId: item.id } })
      ),
    optimistic: [dropFromToConfirm],
    success: false,
    successFor: (_data, item) =>
      t("recurring.confirmed", {
        amount: ledger.money(item.amountMinor, item.currency),
        name: item.description,
      }),
  });
};

export const useSkipRecurring = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (item: PendingRef) =>
      await unwrap(
        recurringApi.skip.$post({ param: { recurringId: item.id } })
      ),
    optimistic: [dropFromToConfirm],
    success: false,
    successFor: (_data, item) =>
      t("recurring.skipped", { name: item.description }),
  });
};
