import { z } from "zod";

export const deletePackageParams = z.object({ packageId: z.uuid() });
