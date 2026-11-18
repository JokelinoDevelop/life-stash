import { VISIT_KINDS } from "@shared/domain/garage-kinds";
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

export const createVisitRequest = z.object({
  byPreviousOwner: z.boolean(),
  carId: z.uuid(),
  date: isoDate,
  items: z
    .array(
      z.object({
        costMinor: moneyMinor.nullable(),
        itemId: z.uuid().nullable(),
        label: shortText(80),
      })
    )
    .min(1)
    .max(50),
  kind: z.enum(VISIT_KINDS),
  notes: optionalText(),
  odometerKm: kilometres.nullable(),
  reminderId: z.uuid().nullable(),
  shop: optionalText(120),
  totalMinor: moneyMinor.nullable(),
  currency,
  datePrecision,
});
