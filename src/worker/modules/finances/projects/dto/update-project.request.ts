import { z } from "zod";

import { optionalText, shortText } from "../../../../core/zod-primitives";

export const updateProjectParams = z.object({ projectId: z.uuid() });

export const updateProjectRequest = z.object({
  name: shortText(120).optional(),
  notes: optionalText(2000).optional(),
  status: z.enum(["active", "done"]).optional(),
});
