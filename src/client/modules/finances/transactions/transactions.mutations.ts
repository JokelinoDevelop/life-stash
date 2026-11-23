import type { InfiniteData } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { optimisticUpdate, useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";
import type { TransactionPage } from "./transactions.queries";

type CreateBody = InferRequestType<
  typeof api.finances.transactions.$post
>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.transactions)[":transactionId"]["$patch"]
>["json"];

export const useCreateTransaction = (
  onFieldError?: (error: Error) => boolean
) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.transactions.$post({ json })),
    onError: onFieldError,
    success: false,
    successFor: (_data, json) =>
      json.kind === "income"
        ? t("transactions.createdIncome")
        : t("transactions.createdExpense"),
  });
};

export const useUpdateTransaction = (
  onFieldError?: (error: Error) => boolean
) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async ({ id, json }: { id: string; json: UpdateBody }) =>
      await unwrap(
        api.finances.transactions[":transactionId"].$patch({
          json,
          param: { transactionId: id },
        })
      ),
    onError: onFieldError,
    success: t("transactions.updated"),
  });
};

/** The deleted row leaves every loaded list at once; totals catch up on refetch. */
const dropTransaction = optimisticUpdate<InfiniteData<TransactionPage>, string>(
  financeKeys.transactionsAll,
  (data, id) => ({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      transactions: page.transactions.filter((row) => row.id !== id),
    })),
  })
);

/** Deletes with an Undo toast (the server keeps the row for a week). */
export const useDeleteTransaction = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (id: string) =>
      await unwrap(
        api.finances.transactions[":transactionId"].$delete({
          param: { transactionId: id },
        })
      ),
    optimistic: [dropTransaction],
    success: t("transactions.deleted"),
    undo: async (_data, id) =>
      await unwrap(
        api.finances.transactions[":transactionId"].restore.$post({
          param: { transactionId: id },
        })
      ),
  });
};
