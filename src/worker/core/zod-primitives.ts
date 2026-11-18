import { z } from "zod";

import { DATE_PRECISIONS, isIsoDate } from "../../shared/domain/dates";
import { CURRENCIES } from "../../shared/domain/money";

/** Building blocks for request DTOs. They are primitives, not DTOs, so sharing them is fine. */
export const isoDate = z
  .string()
  .refine(isIsoDate, { message: "Expected a date as YYYY-MM-DD" });

export const datePrecision = z.enum(DATE_PRECISIONS);

export const currency = z.enum(CURRENCIES);

export const shortText = (max = 120) => z.string().trim().min(1).max(max);

export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value === "" ? null : value));

export const kilometres = z.number().int().min(0).max(5_000_000);

export const moneyMinor = z.number().int().min(0).max(100_000_000_000);
