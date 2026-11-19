import { CATEGORY_ICONS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import { shortText } from "../../../../core/zod-primitives";

export const updateCategoryParams = z.object({ categoryId: z.uuid() });

/** Rename, change icon, archive/unarchive or move; every field is optional. */
export const updateCategoryRequest = z.object({
  archived: z.boolean().optional(),
  icon: z.enum(CATEGORY_ICONS).nullable().optional(),
  name: shortText(60).optional(),
  position: z.number().int().min(0).max(1000).optional(),
});
