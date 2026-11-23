import { z } from "zod";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** PDFs (invoices, receipts) are uploaded as they are, so they may be larger than photos. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const PDF = "application/pdf";

export const uploadUrlRequest = z
  .object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", PDF]),
    ownerId: z.uuid(),
    ownerType: z.enum([
      "car",
      "service_visit",
      "expense",
      "finance_invoice",
      "finance_transaction",
    ]),
    sizeBytes: z.number().int().min(1).max(MAX_PDF_BYTES),
  })
  .refine(
    (input) => input.contentType === PDF || input.sizeBytes <= MAX_PHOTO_BYTES,
    { message: "Images are limited to 5 MB", path: ["sizeBytes"] }
  )
  .refine((input) => input.ownerType !== "car" || input.contentType !== PDF, {
    message: "A car's photo must be an image",
    path: ["contentType"],
  });
