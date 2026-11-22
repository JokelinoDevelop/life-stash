import { z } from "zod";

export const getInviteParams = z.object({ token: z.string().min(20).max(100) });
