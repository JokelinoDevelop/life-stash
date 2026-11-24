import { z } from "zod";

export const listTrainingsQuery = z.object({
  /** "true" includes archived trainings. */
  archived: z.enum(["true", "false"]).optional(),
});
