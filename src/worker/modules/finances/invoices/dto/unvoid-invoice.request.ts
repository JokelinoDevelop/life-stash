import { z } from "zod";

export const unvoidInvoiceParams = z.object({ invoiceId: z.uuid() });
