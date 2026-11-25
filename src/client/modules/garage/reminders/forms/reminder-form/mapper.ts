import { displayToKm, kmToDisplay } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseInteger } from "@/lib/form-schemas";

import type { ReminderDetail } from "../../reminders.queries";
import type { ReminderFormValues } from "./schema";

type UpdateReminderBody = InferRequestType<
  (typeof api.garage.reminders)[":reminderId"]["$put"]
>["json"];

type CreateReminderBody = InferRequestType<
  typeof api.garage.reminders.$post
>["json"];

const distance = (km: number | null, unit: DistanceUnit) =>
  km === null ? "" : String(kmToDisplay(km, unit));

export const reminderFormDefaults: ReminderFormValues = {
  dueDate: "",
  dueOdometer: "",
  intervalKm: "",
  intervalMonths: "",
  kind: "service",
  notes: "",
  title: "",
};

export const reminderToFormValues = (
  { reminder }: ReminderDetail,
  unit: DistanceUnit
): ReminderFormValues => ({
  dueDate: reminder.dueDate ?? "",
  dueOdometer: distance(reminder.dueOdometerKm, unit),
  intervalKm: distance(reminder.intervalKm, unit),
  intervalMonths:
    reminder.intervalMonths === null ? "" : String(reminder.intervalMonths),
  kind: reminder.kind,
  notes: reminder.notes ?? "",
  title: reminder.title,
});

const kmOrNull = (value: string, unit: DistanceUnit): number | null => {
  const parsed = parseInteger(value);

  return parsed === null ? null : displayToKm(parsed, unit);
};

const positiveOrNull = (value: number | null): number | null =>
  value === null || value <= 0 ? null : value;

export const reminderFormToUpdateRequest = (
  values: ReminderFormValues,
  unit: DistanceUnit
): UpdateReminderBody => ({
  dueDate: values.dueDate === "" ? null : values.dueDate,
  dueOdometerKm: kmOrNull(values.dueOdometer, unit),
  intervalKm: positiveOrNull(kmOrNull(values.intervalKm, unit)),
  intervalMonths: positiveOrNull(parseInteger(values.intervalMonths)),
  kind: values.kind,
  notes: emptyToNull(values.notes),
  title: values.title.trim(),
});

export const reminderFormToCreateRequest = (
  values: ReminderFormValues,
  context: { unit: DistanceUnit; carId: string }
): CreateReminderBody => ({
  ...reminderFormToUpdateRequest(values, context.unit),
  carId: context.carId,
});
