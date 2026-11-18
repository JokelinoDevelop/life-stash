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

const PACKAGE_PREFIX = "package:";
const ITEM_PREFIX = "item:";

export const packageTarget = (id: string) => `${PACKAGE_PREFIX}${id}`;
export const itemTarget = (id: string) => `${ITEM_PREFIX}${id}`;

const parseTarget = (target: string) => ({
  itemId: target.startsWith(ITEM_PREFIX)
    ? target.slice(ITEM_PREFIX.length)
    : null,
  packageId: target.startsWith(PACKAGE_PREFIX)
    ? target.slice(PACKAGE_PREFIX.length)
    : null,
});

const distance = (km: number | null, unit: DistanceUnit) =>
  km === null ? "" : String(kmToDisplay(km, unit));

export const reminderFormDefaults: ReminderFormValues = {
  dueDate: "",
  dueOdometer: "",
  intervalKm: "",
  intervalMonths: "",
  kind: "service",
  notes: "",
  target: "",
  title: "",
};

export const reminderToFormValues = (
  { reminder }: ReminderDetail,
  unit: DistanceUnit
): ReminderFormValues => {
  let target = "";

  if (reminder.packageId !== null) {
    target = packageTarget(reminder.packageId);
  } else if (reminder.itemId !== null) {
    target = itemTarget(reminder.itemId);
  }

  return {
    dueDate: reminder.dueDate ?? "",
    dueOdometer: distance(reminder.dueOdometerKm, unit),
    intervalKm: distance(reminder.intervalKm, unit),
    intervalMonths:
      reminder.intervalMonths === null ? "" : String(reminder.intervalMonths),
    kind: reminder.kind,
    notes: reminder.notes ?? "",
    title: reminder.title,
    target,
  };
};

const kmOrNull = (value: string, unit: DistanceUnit): number | null => {
  const parsed = parseInteger(value);

  return parsed === null ? null : displayToKm(parsed, unit);
};

const positiveOrNull = (value: number | null): number | null =>
  value === null || value <= 0 ? null : value;

export const reminderFormToUpdateRequest = (
  values: ReminderFormValues,
  unit: DistanceUnit
): UpdateReminderBody => {
  const target =
    values.kind === "service"
      ? parseTarget(values.target)
      : { itemId: null, packageId: null };

  return {
    ...target,
    dueDate: values.dueDate === "" ? null : values.dueDate,
    dueOdometerKm: kmOrNull(values.dueOdometer, unit),
    intervalKm: positiveOrNull(kmOrNull(values.intervalKm, unit)),
    intervalMonths: positiveOrNull(parseInteger(values.intervalMonths)),
    kind: values.kind,
    notes: emptyToNull(values.notes),
    title: values.title.trim(),
  };
};

export const reminderFormToCreateRequest = (
  values: ReminderFormValues,
  context: { unit: DistanceUnit; carId: string }
): CreateReminderBody => ({
  ...reminderFormToUpdateRequest(values, context.unit),
  carId: context.carId,
});
