import { INVOICE_LANGUAGES } from "@shared/domain/finances/invoice-document";
import { z } from "zod";

import {
  currency as currencyCode,
  optionalText,
  shortText,
} from "../../../../core/zod-primitives";

export const createClientRequest = z.object({
  address: optionalText(500).optional(),
  currency: currencyCode,
  email: z.email().max(254).nullable(),
  /** Defaults to the household's language when creating. */
  invoiceLanguage: z.enum(INVOICE_LANGUAGES).optional(),
  kind: z.enum(["client", "employer"]),
  name: shortText(120),
  notes: optionalText(2000),
  paymentTermsDays: z.number().int().min(0).max(365),
  taxId: optionalText(40).optional(),
});
