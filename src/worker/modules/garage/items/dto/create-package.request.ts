import { z } from "zod";

import { optionalText, shortText } from "../../../../core/zod-primitives";

export const createPackageRequest = z.object({
  itemIds: z.array(z.uuid()).max(50),
  name: shortText(80),
  notes: optionalText(),
});
