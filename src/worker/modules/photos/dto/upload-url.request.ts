import { z } from "zod";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const uploadUrlRequest = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  ownerId: z.uuid(),
  ownerType: z.enum(["service_visit", "expense"]),
  sizeBytes: z.number().int().min(1).max(MAX_PHOTO_BYTES),
});
