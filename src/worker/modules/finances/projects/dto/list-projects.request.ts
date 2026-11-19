import { z } from "zod";

export const listProjectsQuery = z.object({
  clientId: z
    .uuid()
    .optional()
    .transform((value) => value ?? null),
});
