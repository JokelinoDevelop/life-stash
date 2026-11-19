import { z } from "zod";

export const deleteInvoiceParams = z.object({ invoiceId: z.uuid() });
