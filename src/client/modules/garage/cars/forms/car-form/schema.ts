import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import {
  optionalAmount,
  optionalInteger,
  optionalText,
  optionalYear,
  partialDateField,
  requiredText,
} from "@/lib/form-schemas";

export const carFormSchema = z.object({
  color: optionalText(40),
  fuelType: z.string(),
  hasPurchaseDate: z.boolean(),
  make: optionalText(60),
  model: optionalText(60),
  name: requiredText(60),
  notes: optionalText(),
  plate: optionalText(20),
  purchaseCurrency: z.enum(CURRENCIES),
  purchaseDate: partialDateField,
  purchaseOdometer: optionalInteger,
  purchasePrice: optionalAmount,
  vin: optionalText(17),
  year: optionalYear,
});

export type CarFormValues = z.infer<typeof carFormSchema>;
