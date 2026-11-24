import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseInteger } from "@/lib/form-schemas";

import type { SessionDetail } from "../../../fitness.queries";
import { OTHER_TRAINING } from "./schema";
import type { SessionFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.fitness.sessions.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.fitness.sessions)[":sessionId"]["$patch"]
>["json"];

type OccurrenceBody = InferRequestType<
  typeof api.fitness.sessions.occurrence.$put
>["json"];

/** A new session: planned when it's ahead, done when it's today or past. */
export const sessionFormDefaults = (context: {
  date: string;
  today: string;
  trainingId: string;
}): SessionFormValues => ({
  date: context.date,
  durationMinutes: "",
  note: "",
  status: context.date > context.today ? "planned" : "done",
  title: "",
  trainingId: context.trainingId === "" ? OTHER_TRAINING : context.trainingId,
});

/** Missed is derived on the server; in the form it is still "planned". */
export const sessionToFormValues = (
  session: SessionDetail
): SessionFormValues => ({
  date: session.date,
  durationMinutes:
    session.durationMinutes === null ? "" : String(session.durationMinutes),
  note: session.note ?? "",
  status: session.status === "missed" ? "planned" : session.status,
  title: session.title ?? "",
  trainingId: session.trainingId ?? OTHER_TRAINING,
});

const common = (values: SessionFormValues) => ({
  date: values.date,
  durationMinutes: parseInteger(values.durationMinutes),
  note: emptyToNull(values.note),
  status: values.status,
});

const training = (values: SessionFormValues) =>
  values.trainingId === OTHER_TRAINING
    ? { title: values.title.trim(), trainingId: null }
    : { title: null, trainingId: values.trainingId };

export const sessionFormToCreateRequest = (
  values: SessionFormValues
): CreateBody => ({ ...common(values), ...training(values) });

/** A weekly occurrence keeps its training, so only free-form sessions send it. */
export const sessionFormToUpdateRequest = (
  values: SessionFormValues,
  trainingLocked: boolean
): UpdateBody =>
  trainingLocked ? common(values) : { ...common(values), ...training(values) };

export const sessionFormToOccurrenceRequest = (
  values: SessionFormValues,
  occurrence: { scheduleId: string; originalDate: string }
): OccurrenceBody => ({
  ...common(values),
  originalDate: occurrence.originalDate,
  scheduleId: occurrence.scheduleId,
});
