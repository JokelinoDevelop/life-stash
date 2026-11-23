import { z } from "zod";

import { optionalText } from "../../../core/zod-primitives";

export const createInviteRequest = z.object({
  joinMyHousehold: z.boolean(),
  name: optionalText(60),
});
