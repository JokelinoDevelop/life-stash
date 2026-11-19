import { z } from "zod";

export const restoreInvoiceParams = z.object({ invoiceId: z.uuid() });
