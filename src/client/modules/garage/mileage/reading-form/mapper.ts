import { displayToKm, kmToDisplay } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseInteger } from "@/lib/form-schemas";

import type { MileagePoint } from "../mileage.queries";
import type { ReadingFormValues } from "./schema";

type CreateReadingBody = InferRequestType<
  typeof api.garage.mileage.$post
>["json"];

type UpdateReadingBody = InferRequestType<
  (typeof api.garage.mileage)[":readingId"]["$put"]
>["json"];

export const readingFormDefaults = (today: string): ReadingFormValues => ({
  date: today,
  notes: "",
  odometer: "",
});

export const readingToFormValues = (
  point: MileagePoint,
  unit: DistanceUnit
): ReadingFormValues => ({
  date: point.date,
  notes: point.notes ?? "",
  odometer: String(kmToDisplay(point.odometerKm, unit)),
});

/** Odometer typed in the user's unit, converted to km (null while incomplete). */
export const readingOdometerKm = (
  values: ReadingFormValues,
  unit: DistanceUnit
): number | null => {
  const value = parseInteger(values.odometer);

  return value === null ? null : displayToKm(value, unit);
};

export const readingFormToUpdateRequest = (
  values: ReadingFormValues,
  unit: DistanceUnit
): UpdateReadingBody => ({
  date: values.date,
  notes: emptyToNull(values.notes),
  odometerKm: readingOdometerKm(values, unit) ?? 0,
});

export const readingFormToCreateRequest = (
  values: ReadingFormValues,
  context: { carId: string; unit: DistanceUnit }
): CreateReadingBody => ({
  ...readingFormToUpdateRequest(values, context.unit),
  carId: context.carId,
});
