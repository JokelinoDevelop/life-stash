import { z } from "zod";

export const deleteClientParams = z.object({ clientId: z.uuid() });
