import { z } from "zod";

import { registrationResponseSchema } from "../webauthn-schemas";

export const setupVerifyRequest = z.object({
  challengeId: z.uuid(),
  deviceName: z.string().trim().min(1).max(60),
  displayName: z.string().trim().min(1).max(60),
  response: registrationResponseSchema,
  timeZone: z.string().min(1).max(64),
});
