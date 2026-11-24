import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

export const listWeightQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});
