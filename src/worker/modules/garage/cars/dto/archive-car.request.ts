import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

export const archiveCarParams = z.object({ carId: z.uuid() });

export const archiveCarRequest = z.object({
  soldDate: isoDate.nullable(),
});
