import { z } from "zod";

import { optionalText, shortText } from "../../../../core/zod-primitives";

const MAX_VAT_RATE_BP = 10_000;

/** The whole profile (PUT replaces it). */
export const updateBusinessProfileRequest = z.object({
  address: z.string().trim().max(500),
  bankAddress: optionalText(200),
  bankCountry: optionalText(80),
  bankName: optionalText(120),
  companyId: optionalText(40),
  /** Basis points: 1800 = 18%. */
  defaultVatRateBp: z.number().int().min(0).max(MAX_VAT_RATE_BP),
  email: z.email().max(254).nullable(),
  footerNote: optionalText(300),
  iban: optionalText(40),
  name: shortText(120),
  phone: optionalText(40),
  swift: optionalText(20),
  taxId: optionalText(40),
  vatRegistered: z.boolean(),
});
