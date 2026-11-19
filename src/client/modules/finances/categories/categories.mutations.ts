import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";

type CreateBody = InferRequestType<
  typeof api.finances.categories.$post
>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.categories)[":categoryId"]["$patch"]
>["json"];

export const useCreateCategory = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.categories.$post({ json })),
    success: t("categories.created"),
  });
};

/** Rename / change icon / move. Archive and restore have their own toasts. */
export const useUpdateCategory = (success: string | false) =>
  useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async ({ id, json }: { id: string; json: UpdateBody }) =>
      await unwrap(
        api.finances.categories[":categoryId"].$patch({
          json,
          param: { categoryId: id },
        })
      ),
    success,
  });

export const useArchiveCategory = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async ({ archived, id }: { id: string; archived: boolean }) =>
      await unwrap(
        api.finances.categories[":categoryId"].$patch({
          json: { archived },
          param: { categoryId: id },
        })
      ),
    success: false,
    successFor: (_data, { archived }) =>
      archived ? t("categories.archivedToast") : t("categories.restoredToast"),
  });
};

export const useDeleteCategory = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (id: string) =>
      await unwrap(
        api.finances.categories[":categoryId"].$delete({
          param: { categoryId: id },
        })
      ),
    success: t("categories.deleted"),
  });
};
