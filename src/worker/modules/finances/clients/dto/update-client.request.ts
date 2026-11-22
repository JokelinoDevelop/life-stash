import { INVOICE_LANGUAGES } from "@shared/domain/finances/invoice-document";
import { z } from "zod";

import {
  currency as currencyCode,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const updateClientParams = z.object({ clientId: z.uuid() });

/** Edit fields or archive / unarchive; every field is optional. */
export const updateClientRequest = z.object({
  archived: z.boolean().optional(),
  address: optionalText(500).optional(),
  currency: currencyCode.optional(),
  email: z.email().max(254).nullable().optional(),
  /** Defaults to the household's language when creating. */
  invoiceLanguage: z.enum(INVOICE_LANGUAGES).optional(),
  kind: z.enum(["client", "employer"]).optional(),
  name: shortText(120).optional(),
  notes: optionalText(2000).optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  taxId: optionalText(40).optional(),
});
