import { z } from "zod";

import { authenticationResponseSchema } from "../webauthn-schemas";

export const loginVerifyRequest = z.object({
  challengeId: z.uuid(),
  response: authenticationResponseSchema,
});
