import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

export const getLastNoteQuery = z.object({
  before: isoDate,
  trainingId: z.uuid(),
});
