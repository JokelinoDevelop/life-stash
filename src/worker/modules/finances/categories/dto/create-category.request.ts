import {
  CATEGORY_ICONS,
  TRANSACTION_KINDS,
} from "@shared/domain/finances/kinds";
import { z } from "zod";

import { shortText } from "../../../../core/zod-primitives";

export const createCategoryRequest = z.object({
  icon: z.enum(CATEGORY_ICONS).nullable(),
  kind: z.enum(TRANSACTION_KINDS),
  name: shortText(60),
});
