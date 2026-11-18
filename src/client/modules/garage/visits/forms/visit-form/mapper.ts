import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { displayToKm, kmToDisplay } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseAmount, parseInteger } from "@/lib/form-schemas";
import {
  emptyPartialDate,
  partialDateFromIso,
  partialDateToIso,
} from "@/lib/partial-date";

import type { VisitDetail } from "../../visits.queries";
import type { VisitFormItem, VisitFormValues } from "./schema";

type CreateVisitBody = InferRequestType<typeof api.garage.visits.$post>["json"];

type UpdateVisitBody = InferRequestType<
  (typeof api.garage.visits)[":visitId"]["$put"]
>["json"];

interface MapperContext {
  unit: DistanceUnit;
  currency: Currency;
  today: string;
}

export const newVisitItem = (item: {
  itemId: string;
  label: string;
}): VisitFormItem => ({
  cost: "",
  itemId: item.itemId,
  key: crypto.randomUUID(),
  label: item.label,
});

export const visitFormDefaults = (
  context: MapperContext,
  items: { itemId: string; label: string }[] = []
): VisitFormValues => ({
  byPreviousOwner: false,
  currency: context.currency,
  date: emptyPartialDate(context.today),
  items: items.map(newVisitItem),
  kind: "maintenance",
  notes: "",
  odometer: "",
  shop: "",
  total: "",
});

const money = (minor: number | null) =>
  minor === null ? "" : String(toMajor(minor));

export const visitToFormValues = (
  visit: VisitDetail,
  unit: DistanceUnit
): VisitFormValues => ({
  byPreviousOwner: visit.byPreviousOwner,
  currency: visit.currency,
  date: partialDateFromIso(visit.date, visit.datePrecision),
  items: visit.items.map((item) => ({
    cost: money(item.costMinor),
    itemId: item.itemId ?? "",
    key: item.id,
    label: item.label,
  })),
  kind: visit.kind,
  notes: visit.notes ?? "",
  odometer:
    visit.odometerKm === null
      ? ""
      : String(kmToDisplay(visit.odometerKm, unit)),
  shop: visit.shop ?? "",
  total: money(visit.totalMinor),
});

const minorOrNull = (value: string): number | null => {
  const amount = parseAmount(value);

  return amount === null ? null : toMinor(amount);
};

export const visitFormToUpdateRequest = (
  values: VisitFormValues,
  unit: DistanceUnit
): UpdateVisitBody => {
  const date = partialDateToIso(values.date);
  const odometer = parseInteger(values.odometer);

  return {
    byPreviousOwner: values.byPreviousOwner,
    currency: values.currency,
    date: date?.date ?? "",
    datePrecision: date?.precision ?? "day",
    items: values.items.map((item) => ({
      costMinor: minorOrNull(item.cost),
      itemId: item.itemId === "" ? null : item.itemId,
      label: item.label.trim(),
    })),
    kind: values.kind,
    notes: emptyToNull(values.notes),
    odometerKm: odometer === null ? null : displayToKm(odometer, unit),
    shop: emptyToNull(values.shop),
    totalMinor: minorOrNull(values.total),
  };
};

export const visitFormToCreateRequest = (
  values: VisitFormValues,
  context: { unit: DistanceUnit; carId: string; reminderId: string | null }
): CreateVisitBody => ({
  ...visitFormToUpdateRequest(values, context.unit),
  carId: context.carId,
  reminderId: context.reminderId,
});
