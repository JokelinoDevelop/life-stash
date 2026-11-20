import { z } from "zod";

import { shortText } from "../../../../core/zod-primitives";

export const issueInvoiceParams = z.object({ invoiceId: z.uuid() });

export const issueInvoiceRequest = z.object({
  /** `YYYY-NNN`, `YYYY/NNN` or a plain `NNN` of the issue year; null takes the next one. */
  number: shortText(40).nullable().default(null),
});
