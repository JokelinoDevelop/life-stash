import { z } from "zod";

export const deletePhotoParams = z.object({ photoId: z.uuid() });
