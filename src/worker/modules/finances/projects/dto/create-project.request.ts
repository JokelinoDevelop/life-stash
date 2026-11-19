import { z } from "zod";

import { optionalText, shortText } from "../../../../core/zod-primitives";

export const createProjectRequest = z.object({
  clientId: z.uuid(),
  name: shortText(120),
  notes: optionalText(2000),
});
