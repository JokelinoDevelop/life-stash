import { z } from "zod";

import { isoDate } from "../../../../core/zod-primitives";

/** No `from` / `to` means all time; both or neither. */
export const financeOverviewQuery = z
  .object({
    categoryId: z
      .uuid()
      .optional()
      .transform((value) => value ?? null),
    clientId: z
      .uuid()
      .optional()
      .transform((value) => value ?? null),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((query) => (query.from === undefined) === (query.to === undefined), {
    message: "from and to go together",
    path: ["to"],
  })
  .refine(
    (query) =>
      query.from === undefined ||
      query.to === undefined ||
      query.from <= query.to,
    { message: "from must not be after to", path: ["to"] }
  )
  .transform(({ categoryId, clientId, from, to }) => ({
    categoryId,
    clientId,
    range: from === undefined || to === undefined ? null : { from, to },
  }));
