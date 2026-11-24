import { z } from "zod";

export const updateFitnessSettingsRequest = z.object({
  reminders: z.boolean(),
});
