import { z } from "zod";

import { MAX_PHOTO_BYTES } from "./upload-url.request";

export const createPhotoRequest = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  objectKey: z.string().min(1).max(300),
  ownerId: z.uuid(),
  ownerType: z.enum(["service_visit", "expense"]),
  sizeBytes: z.number().int().min(1).max(MAX_PHOTO_BYTES),
});
