import { queryOptions } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";

export const projectsQuery = (clientId: string | null) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.finances.projects.$get({
          query: clientId === null ? {} : { clientId },
        })
      ),
    queryKey: financeKeys.projects(clientId),
  });

export type ProjectItem = SuccessBody<
  Awaited<ReturnType<typeof api.finances.projects.$get>>
>["projects"][number];

type CreateBody = InferRequestType<typeof api.finances.projects.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.projects)[":projectId"]["$patch"]
>["json"];

const projectApi = api.finances.projects[":projectId"];

export const useCreateProject = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.projects.$post({ json })),
    success: t("projects.created"),
  });
};

export const useUpdateProject = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async ({ id, json }: { id: string; json: UpdateBody }) =>
      await unwrap(projectApi.$patch({ json, param: { projectId: id } })),
    success: t("projects.updated"),
  });
};

export const useDeleteProject = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate: [financeKeys.all],
    mutationFn: async (id: string) =>
      await unwrap(projectApi.$delete({ param: { projectId: id } })),
    success: t("projects.deleted"),
  });
};
