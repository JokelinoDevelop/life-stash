import { z } from "zod";

import { shortText } from "../../../../core/zod-primitives";

export const createItemRequest = z.object({ name: shortText(80) });
