import { z } from "zod";

import {
  currency as currencyCode,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const createClientRequest = z.object({
  currency: currencyCode,
  email: z.email().max(254).nullable(),
  kind: z.enum(["client", "employer"]),
  name: shortText(120),
  notes: optionalText(2000),
  paymentTermsDays: z.number().int().min(0).max(365),
});
