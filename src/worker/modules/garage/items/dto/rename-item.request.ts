import { z } from "zod";

import { shortText } from "../../../../core/zod-primitives";

export const renameItemParams = z.object({ itemId: z.uuid() });

export const renameItemRequest = z.object({ name: shortText(80) });
