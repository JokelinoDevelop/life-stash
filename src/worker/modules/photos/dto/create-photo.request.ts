import { z } from "zod";

import { MAX_PDF_BYTES, MAX_PHOTO_BYTES } from "./upload-url.request";

export const createPhotoRequest = z
  .object({
    contentType: z.enum([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]),
    /** The original name, shown next to documents. */
    fileName: z.string().trim().min(1).max(200).nullable().optional(),
    objectKey: z.string().min(1).max(300),
    ownerId: z.uuid(),
    ownerType: z.enum([
      "service_visit",
      "expense",
      "finance_invoice",
      "finance_transaction",
    ]),
    sizeBytes: z.number().int().min(1).max(MAX_PDF_BYTES),
  })
  .refine(
    (input) =>
      input.contentType === "application/pdf" ||
      input.sizeBytes <= MAX_PHOTO_BYTES,
    { message: "Images are limited to 5 MB", path: ["sizeBytes"] }
  );
