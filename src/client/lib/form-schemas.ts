import { DATE_PRECISIONS, isIsoDate } from "@shared/domain/dates";
import { z } from "zod";

import { partialDateToIso } from "./partial-date";

/**
 * Primitives for client form schemas. Forms keep raw input as strings; each form's mapper
 * converts them for the API. Messages are `validation.*` translation keys.
 */
const DECIMAL = /^\d+(?:[.,]\d{1,2})?$/u;
const REQUIRED = "validation.required";
const NUMBER = "validation.number";
const TOO_LONG = "validation.tooLong";
const INTEGER = /^\d+$/u;

export const requiredText = (max = 120) =>
  z.string().trim().min(1, REQUIRED).max(max, TOO_LONG);

export const optionalText = (max = 2000) =>
  z.string().trim().max(max, TOO_LONG);

/** Whole number (km, years…) typed as text; empty is allowed. */
export const optionalInteger = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || INTEGER.test(value.replaceAll(/[\s.,]/gu, "")),
    NUMBER
  );

export const requiredInteger = z
  .string()
  .trim()
  .min(1, REQUIRED)
  .refine((value) => INTEGER.test(value.replaceAll(/[\s.,]/gu, "")), NUMBER);

/** Money typed as text with up to two decimals; empty is allowed. */
export const optionalAmount = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || DECIMAL.test(value.replaceAll(/\s/gu, "")),
    NUMBER
  );

export const requiredAmount = z
  .string()
  .trim()
  .min(1, REQUIRED)
  .refine((value) => DECIMAL.test(value.replaceAll(/\s/gu, "")), NUMBER);

export const optionalYear = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^(?:19|20|21)\d{2}$/u.test(value),
    "validation.year"
  );

export const isoDateField = z.string().refine(isIsoDate, "validation.date");

export const partialDateField = z
  .object({
    date: z.string(),
    month: z.string(),
    precision: z.enum(DATE_PRECISIONS),
    year: z.string(),
  })
  .refine((value) => partialDateToIso(value) !== null, "validation.date");

/** Parses text typed in a form into a whole number (spaces and separators ignored). */
export const parseInteger = (value: string): number | null => {
  const compact = value.replaceAll(/[\s.,]/gu, "");

  return compact === "" ? null : Math.trunc(Number(compact));
};

/** Parses a decimal amount typed in a form (comma or dot) into a number. */
export const parseAmount = (value: string): number | null => {
  const compact = value.replaceAll(/\s/gu, "").replace(",", ".");

  return compact === "" ? null : Number(compact);
};

export const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
};

export const MIN_PASSWORD_LENGTH = 10;

export const emailField = z
  .string()
  .trim()
  .pipe(z.email("validation.email").max(254, TOO_LONG));

export const newPasswordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, "validation.passwordLength")
  .max(128, TOO_LONG);
