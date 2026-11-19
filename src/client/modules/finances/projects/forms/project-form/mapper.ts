import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull } from "@/lib/form-schemas";

import type { ProjectItem } from "../../projects.queries";
import type { ProjectFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.finances.projects.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.projects)[":projectId"]["$patch"]
>["json"];

export const projectFormDefaults = (): ProjectFormValues => ({
  name: "",
  notes: "",
});

export const projectToFormValues = (
  project: ProjectItem
): ProjectFormValues => ({
  name: project.name,
  notes: project.notes ?? "",
});

export const projectFormToCreateRequest = (
  values: ProjectFormValues,
  client: string
): CreateBody => ({
  clientId: client,
  name: values.name.trim(),
  notes: emptyToNull(values.notes),
});

export const projectFormToUpdateRequest = (
  values: ProjectFormValues
): UpdateBody => ({
  name: values.name.trim(),
  notes: emptyToNull(values.notes),
});
