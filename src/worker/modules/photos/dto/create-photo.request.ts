import { z } from "zod";

import { MAX_PDF_BYTES, MAX_PHOTO_BYTES } from "./upload-url.request";

const PDF = "application/pdf";

export const createPhotoRequest = z
  .object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", PDF]),
    /** The original name, shown next to documents. */
    fileName: z.string().trim().min(1).max(200).nullable().optional(),
    /** An invoice PDF the app generated when issuing (kept as sent). */
    generated: z.boolean().optional(),
    /** With `generated`: replaces the invoice's earlier generated PDF (redrawn). */
    replace: z.boolean().optional(),
    objectKey: z.string().min(1).max(300),
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
  .refine(
    (input) =>
      input.generated !== true ||
      (input.ownerType === "finance_invoice" && input.contentType === PDF),
    { message: "Only invoice PDFs can be generated", path: ["generated"] }
  )
  .refine((input) => input.replace !== true || input.generated === true, {
    message: "Only a generated PDF can replace another",
    path: ["replace"],
  })
  .refine((input) => input.ownerType !== "car" || input.contentType !== PDF, {
    message: "A car's photo must be an image",
    path: ["contentType"],
  });
