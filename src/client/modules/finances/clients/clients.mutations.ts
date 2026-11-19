import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";

type CreateBody = InferRequestType<typeof api.finances.clients.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.clients)[":clientId"]["$patch"]
>["json"];

export const useCreateClient = (onFieldError?: (error: Error) => boolean) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.clients.$post({ json })),
    onError: onFieldError,
    success: false,
    successFor: (_data, json) => t("clients.created", { name: json.name }),
  });
};

export const useUpdateClient = (onFieldError?: (error: Error) => boolean) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async ({
      id,
      json,
    }: {
      id: string;
      json: UpdateBody;
      name: string;
    }) =>
      await unwrap(
        api.finances.clients[":clientId"].$patch({
          json,
          param: { clientId: id },
        })
      ),
    onError: onFieldError,
    success: false,
    successFor: (_data, { json, name }) => {
      if (json.archived === true) {
        return t("clients.archivedToast", { name });
      }

      if (json.archived === false) {
        return t("clients.restoredToast", { name });
      }

      return t("clients.updated", { name });
    },
  });
};
