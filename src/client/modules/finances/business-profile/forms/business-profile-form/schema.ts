import { z } from "zod";

import { optionalText, requiredText } from "@/lib/form-schemas";

const VAT_RATE = /^\d{1,3}(?:[.,]\d{1,2})?$/u;
const MAX_VAT_PERCENT = 100;

export const businessProfileFormSchema = z.object({
  address: optionalText(500),
  bankAddress: optionalText(200),
  bankCountry: optionalText(80),
  bankName: optionalText(120),
  companyId: optionalText(40),
  /** Percent, e.g. "18". */
  defaultVatRate: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (VAT_RATE.test(value) &&
          Number(value.replace(",", ".")) <= MAX_VAT_PERCENT),
      "validation.number"
    ),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "validation.email"
    ),
  footerNote: optionalText(300),
  iban: optionalText(40),
  name: requiredText(120),
  phone: optionalText(40),
  swift: optionalText(20),
  taxId: optionalText(40),
  vatRegistered: z.boolean(),
});

export type BusinessProfileFormValues = z.infer<
  typeof businessProfileFormSchema
>;
