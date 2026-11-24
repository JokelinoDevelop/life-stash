import { z } from "zod";

import { isoDate, optionalText } from "../../../../core/zod-primitives";

/** One entry per day: the same date replaces the earlier entry. */
export const upsertWeightRequest = z.object({
  date: isoDate,
  note: optionalText(500),
  /** 20–400 kg, in grams. */
  weightGrams: z.number().int().min(20_000).max(400_000),
});
