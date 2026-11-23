import { z } from "zod";

export const moveUserParams = z.object({ userId: z.uuid() });
