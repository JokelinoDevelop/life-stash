import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";
import { decodeCursor } from "../cursor";

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value === undefined || value === "" ? null : value));

export const listTransactionsQuery = z.object({
  categoryId: z
    .uuid()
    .optional()
    .transform((value) => value ?? null),
  clientId: z
    .uuid()
    .optional()
    .transform((value) => value ?? null),
  cursor: z
    .string()
    .max(200)
    .optional()
    .transform((value) => (value === undefined ? null : decodeCursor(value))),
  from: isoDate.optional().transform((value) => value ?? null),
  kind: z
    .enum(TRANSACTION_KINDS)
    .optional()
    .transform((value) => value ?? null),
  q: optionalText,
  to: isoDate.optional().transform((value) => value ?? null),
});
