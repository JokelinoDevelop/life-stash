import { z } from "zod";

export const voidInvoiceParams = z.object({ invoiceId: z.uuid() });
