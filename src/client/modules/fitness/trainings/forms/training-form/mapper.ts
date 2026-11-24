import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseInteger } from "@/lib/form-schemas";

import type { Training } from "../../../fitness.queries";
import type { TrainingFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.fitness.trainings.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.fitness.trainings)[":trainingId"]["$patch"]
>["json"];

const toWeekdays = (values: readonly string[]): number[] =>
  values
    .flatMap((value) => {
      const day = Number(value);

      return Number.isInteger(day) && day >= 1 && day <= 7 ? [day] : [];
    })
    .toSorted((a, b) => a - b);

export const trainingFormDefaults = (): TrainingFormValues => ({
  description: "",
  durationMinutes: "",
  name: "",
  weekdays: [],
});

export const trainingToFormValues = (
  training: Training
): TrainingFormValues => ({
  description: training.description ?? "",
  durationMinutes:
    training.durationMinutes === null ? "" : String(training.durationMinutes),
  name: training.name,
  weekdays: training.weekdays.map(String),
});

export const trainingFormToCreateRequest = (
  values: TrainingFormValues
): CreateBody => ({
  description: emptyToNull(values.description),
  durationMinutes: parseInteger(values.durationMinutes),
  name: values.name.trim(),
  weekdays: toWeekdays(values.weekdays),
});

export const trainingFormToUpdateRequest = (
  values: TrainingFormValues
): UpdateBody => trainingFormToCreateRequest(values);
