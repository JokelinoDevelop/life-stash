import { gramsToKg, kgToGrams } from "@shared/domain/fitness/weight";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseAmount } from "@/lib/form-schemas";

import type { WeightEntry } from "../../../fitness.queries";
import type { WeightFormValues } from "./schema";

type UpsertBody = InferRequestType<typeof api.fitness.weight.$put>["json"];

/** A new entry, prefilled with the last weight so only the change needs typing. */
export const weightFormDefaults = (context: {
  date: string;
  lastGrams: number | null;
}): WeightFormValues => ({
  date: context.date,
  kg: context.lastGrams === null ? "" : String(gramsToKg(context.lastGrams)),
  note: "",
});

export const weightToFormValues = (entry: WeightEntry): WeightFormValues => ({
  date: entry.date,
  kg: String(gramsToKg(entry.weightGrams)),
  note: entry.note ?? "",
});

/** Kilograms → whole grams (the only unit stored). */
export const weightFormToRequest = (values: WeightFormValues): UpsertBody => ({
  date: values.date,
  note: emptyToNull(values.note),
  weightGrams: kgToGrams(parseAmount(values.kg) ?? 0),
});
