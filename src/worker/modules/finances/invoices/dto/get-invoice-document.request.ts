import { z } from "zod";

export const getInvoiceDocumentParams = z.object({ invoiceId: z.uuid() });
