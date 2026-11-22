import { pdf } from "@react-pdf/renderer";

import type { InvoicePdfData, InvoicePdfLabels } from "./invoice-pdf-data";
import { InvoicePdfDocument } from "./invoice-pdf-document";

/**
 * Draws the invoice into a PDF blob. This module pulls in `@react-pdf/renderer` and the
 * fonts, so it is only ever loaded with `import()` (preview, issue, download).
 */
export const renderInvoicePdf = async (
  data: InvoicePdfData,
  labels: InvoicePdfLabels
): Promise<Blob> =>
  await pdf(<InvoicePdfDocument data={data} labels={labels} />).toBlob();
