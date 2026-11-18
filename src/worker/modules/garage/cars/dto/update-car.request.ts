import { z } from "zod";

import {
  currency,
  datePrecision,
  isoDate,
  kilometres,
  moneyMinor,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const updateCarParams = z.object({ carId: z.uuid() });

export const updateCarRequest = z.object({
  color: optionalText(40),
  fuelType: optionalText(40),
  make: optionalText(60),
  model: optionalText(60),
  name: shortText(60),
  notes: optionalText(),
  plate: optionalText(20),
  purchaseCurrency: currency.nullable(),
  purchaseDate: isoDate.nullable(),
  purchaseDatePrecision: datePrecision.nullable(),
  purchaseOdometerKm: kilometres.nullable(),
  purchasePriceMinor: moneyMinor.nullable(),
  vin: optionalText(17),
  year: z.number().int().min(1900).max(2100).nullable(),
});
