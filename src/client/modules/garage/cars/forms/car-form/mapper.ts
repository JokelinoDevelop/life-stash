import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { displayToKm, kmToDisplay } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import type { InferRequestType } from "hono/client";

import type { api, SuccessBody } from "@/lib/api";
import { emptyToNull, parseAmount, parseInteger } from "@/lib/form-schemas";
import {
  emptyPartialDate,
  partialDateFromIso,
  partialDateToIso,
} from "@/lib/partial-date";

import type { CarFormValues } from "./schema";

type CreateCarBody = InferRequestType<typeof api.garage.cars.$post>["json"];

type CarResponse = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.cars)[":carId"]["$get"]>>
>;

interface MapperContext {
  unit: DistanceUnit;
  currency: Currency;
  today: string;
}

export const carFormDefaults = (context: MapperContext): CarFormValues => ({
  color: "",
  fuelType: "",
  hasPurchaseDate: false,
  make: "",
  model: "",
  name: "",
  notes: "",
  plate: "",
  purchaseCurrency: context.currency,
  purchaseDate: emptyPartialDate(context.today),
  purchaseOdometer: "",
  purchasePrice: "",
  vin: "",
  year: "",
});

export const carToFormValues = (
  { car }: CarResponse,
  context: MapperContext
): CarFormValues => ({
  color: car.color ?? "",
  fuelType: car.fuelType ?? "",
  hasPurchaseDate: car.purchaseDate !== null,
  make: car.make ?? "",
  model: car.model ?? "",
  name: car.name,
  notes: car.notes ?? "",
  plate: car.plate ?? "",
  purchaseCurrency: car.purchaseCurrency ?? context.currency,
  purchaseDate:
    car.purchaseDate === null
      ? emptyPartialDate(context.today)
      : partialDateFromIso(
          car.purchaseDate,
          car.purchaseDatePrecision ?? "day"
        ),
  purchaseOdometer:
    car.purchaseOdometerKm === null
      ? ""
      : String(kmToDisplay(car.purchaseOdometerKm, context.unit)),
  purchasePrice:
    car.purchasePriceMinor === null
      ? ""
      : String(toMajor(car.purchasePriceMinor)),
  vin: car.vin ?? "",
  year: car.year === null ? "" : String(car.year),
});

export const carFormToRequest = (
  values: CarFormValues,
  unit: DistanceUnit
): CreateCarBody => {
  const purchase = values.hasPurchaseDate
    ? partialDateToIso(values.purchaseDate)
    : null;

  const odometer = parseInteger(values.purchaseOdometer);
  const price = parseAmount(values.purchasePrice);

  return {
    color: emptyToNull(values.color),
    fuelType: emptyToNull(values.fuelType),
    make: emptyToNull(values.make),
    model: emptyToNull(values.model),
    name: values.name.trim(),
    notes: emptyToNull(values.notes),
    plate: emptyToNull(values.plate),
    purchaseCurrency: price === null ? null : values.purchaseCurrency,
    purchaseDate: purchase?.date ?? null,
    purchaseDatePrecision: purchase?.precision ?? null,
    purchaseOdometerKm: odometer === null ? null : displayToKm(odometer, unit),
    purchasePriceMinor: price === null ? null : toMinor(price),
    vin: emptyToNull(values.vin),
    year: parseInteger(values.year),
  };
};
