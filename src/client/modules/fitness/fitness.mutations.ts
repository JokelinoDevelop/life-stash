import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { fitnessKeys } from "./fitness-keys";

type CreateTrainingBody = InferRequestType<
  typeof api.fitness.trainings.$post
>["json"];

type UpdateTrainingBody = InferRequestType<
  (typeof api.fitness.trainings)[":trainingId"]["$patch"]
>["json"];

type CreateSessionBody = InferRequestType<
  typeof api.fitness.sessions.$post
>["json"];

type UpdateSessionBody = InferRequestType<
  (typeof api.fitness.sessions)[":sessionId"]["$patch"]
>["json"];

type OccurrenceBody = InferRequestType<
  typeof api.fitness.sessions.occurrence.$put
>["json"];

type WeightBody = InferRequestType<typeof api.fitness.weight.$put>["json"];

const invalidate = [fitnessKeys.all];

export const useCreateTraining = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async (json: CreateTrainingBody) =>
      await unwrap(api.fitness.trainings.$post({ json })),
    success: t("trainings.created"),
  });
};

export const useUpdateTraining = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async ({
      id,
      json,
    }: {
      id: string;
      json: UpdateTrainingBody;
    }) =>
      await unwrap(
        api.fitness.trainings[":trainingId"].$patch({
          json,
          param: { trainingId: id },
        })
      ),
    success: t("trainings.updated"),
  });
};

export const useArchiveTraining = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ archived, id }: { archived: boolean; id: string }) =>
      await unwrap(
        archived
          ? api.fitness.trainings[":trainingId"].archive.$post({
              param: { trainingId: id },
            })
          : api.fitness.trainings[":trainingId"].restore.$post({
              param: { trainingId: id },
            })
      ),
    success: false,
    successFor: (_data, { archived }) =>
      archived ? t("trainings.archivedToast") : t("trainings.restoredToast"),
  });
};

export const useCreateSession = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async (json: CreateSessionBody) =>
      await unwrap(api.fitness.sessions.$post({ json })),
    success: false,
    successFor: (_data, json) =>
      json.status === "planned"
        ? t("sessions.scheduled")
        : t("sessions.logged"),
  });
};

export const useUpdateSession = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id, json }: { id: string; json: UpdateSessionBody }) =>
      await unwrap(
        api.fitness.sessions[":sessionId"].$patch({
          json,
          param: { sessionId: id },
        })
      ),
    success: t("sessions.saved"),
  });
};

/** Done / skipped / moved / note on a weekly occurrence. */
export const usePutOccurrence = (success?: string) => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async (json: OccurrenceBody) =>
      await unwrap(api.fitness.sessions.occurrence.$put({ json })),
    success: success ?? t("sessions.saved"),
  });
};

export const useDeleteSession = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async (id: string) =>
      await unwrap(
        api.fitness.sessions[":sessionId"].$delete({ param: { sessionId: id } })
      ),
    success: t("sessions.deleted"),
  });
};

export const useUpsertWeight = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async (json: WeightBody) =>
      await unwrap(api.fitness.weight.$put({ json })),
    success: t("weight.saved"),
  });
};

export const useDeleteWeight = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate,
    mutationFn: async (id: string) =>
      await unwrap(
        api.fitness.weight[":entryId"].$delete({ param: { entryId: id } })
      ),
    success: t("weight.deleted"),
  });
};

export const useUpdateFitnessSettings = () => {
  const { t } = useTranslation("fitness");

  return useAppMutation({
    invalidate: [fitnessKeys.settings],
    mutationFn: async (reminders: boolean) =>
      await unwrap(api.fitness.settings.$put({ json: { reminders } })),
    success: false,
    successFor: (_data, reminders) =>
      reminders ? t("settings.remindersOn") : t("settings.remindersOff"),
  });
};
