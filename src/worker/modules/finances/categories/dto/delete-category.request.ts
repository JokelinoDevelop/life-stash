import { z } from "zod";

export const deleteCategoryParams = z.object({ categoryId: z.uuid() });
