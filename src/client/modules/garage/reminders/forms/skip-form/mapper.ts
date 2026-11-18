import { displayToKm } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { parseInteger } from "@/lib/form-schemas";

import type { SkipFormValues } from "./schema";

type SkipBody = InferRequestType<
  (typeof api.garage.reminders)[":reminderId"]["skip"]["$post"]
>["json"];

export const skipFormDefaults = (today: string): SkipFormValues => ({
  date: today,
  odometer: "",
});

export const skipFormToRequest = (
  values: SkipFormValues,
  unit: DistanceUnit
): SkipBody => {
  const odometer = parseInteger(values.odometer);

  return {
    date: values.date,
    odometerKm: odometer === null ? null : displayToKm(odometer, unit),
  };
};
