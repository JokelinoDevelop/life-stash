import { z } from "zod";

export const revokeInviteParams = z.object({ inviteId: z.uuid() });
