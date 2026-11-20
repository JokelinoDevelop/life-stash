import { z } from "zod";

/** A rate like "61.5" or "61,495"; empty means "not set". */
const RATE = /^\d{1,7}(?:[.,]\d{1,4})?$/u;

const rateField = z
  .string()
  .trim()
  .refine((value) => value === "" || RATE.test(value), "validation.number");

/** One text field per currency: how many main-currency units one unit is worth. */
export const exchangeRatesFormSchema = z.object({
  EUR: rateField,
  MKD: rateField,
  USD: rateField,
});

export type ExchangeRatesFormValues = z.infer<typeof exchangeRatesFormSchema>;
