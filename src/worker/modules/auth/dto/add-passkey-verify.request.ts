import { z } from "zod";

import { registrationResponseSchema } from "../webauthn-schemas";

export const addPasskeyVerifyRequest = z.object({
  challengeId: z.uuid(),
  deviceName: z.string().trim().min(1).max(60),
  response: registrationResponseSchema,
});
