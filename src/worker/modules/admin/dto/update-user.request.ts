import { z } from "zod";

export const updateUserParams = z.object({ userId: z.uuid() });

export const updateUserRequest = z.object({ disabled: z.boolean() });
