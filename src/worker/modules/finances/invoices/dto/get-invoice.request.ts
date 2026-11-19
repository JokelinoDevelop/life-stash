import { z } from "zod";

export const getInvoiceParams = z.object({ invoiceId: z.uuid() });
