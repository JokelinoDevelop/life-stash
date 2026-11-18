import { z } from "zod";

export const archiveItemParams = z.object({ itemId: z.uuid() });

export const archiveItemRequest = z.object({ archived: z.boolean() });
