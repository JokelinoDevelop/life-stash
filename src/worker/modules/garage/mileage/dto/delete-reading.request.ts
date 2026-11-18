import { z } from "zod";

export const deleteReadingParams = z.object({ readingId: z.uuid() });
