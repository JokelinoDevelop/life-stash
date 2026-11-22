import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { useConfig } from "@/lib/session";

import {
  attachmentsQuery,
  uploadGeneratedPdf,
} from "../attachments/attachments.queries";
import { financeKeys } from "../finance-keys";
import type { InvoicePdfData } from "../invoice-pdf/invoice-pdf-data";
import {
  RendererUnavailableError,
  openPendingTab,
  pdfFileName,
  saveBlob,
  useInvoicePdfRenderer,
} from "../invoice-pdf/use-invoice-pdf";

type InvoiceDocument = SuccessBody<
  Awaited<
    ReturnType<(typeof api.finances.invoices)[":invoiceId"]["document"]["$get"]>
  >
>["document"];

/** The frozen data of an invoice, as the PDF component draws it. */
export const toPdfData = (document: InvoiceDocument): InvoicePdfData => ({
  client: document.client,
  currency: document.currency,
  dueDate: document.dueDate,
  issueDate: document.issueDate,
  issuer: document.issuer,
  language: document.language,
  lines: document.lines.map((line, index) => ({
    ...line,
    key: String(index),
  })),
  note: document.note,
  number: document.number,
  periodEnd: document.periodEnd,
  periodStart: document.periodStart,
  purchaseOrder: document.purchaseOrder,
  totals: document.totals,
});

const documentQuery = (invoiceId: string) => ({
  queryFn: async () =>
    await unwrap(
      api.finances.invoices[":invoiceId"].document.$get({
        param: { invoiceId },
      })
    ),
  queryKey: financeKeys.invoiceDocument(invoiceId),
  staleTime: 0,
});

/**
 * Draws an issued invoice from its frozen data and keeps the file: uploaded as the invoice's
 * generated attachment when storage is set up. Optionally saves it to the device too.
 */
export const useStoreInvoicePdf = () => {
  const { t } = useTranslation("finances");
  const queryClient = useQueryClient();
  const render = useInvoicePdfRenderer();
  const storage = useConfig().data?.photosEnabled === true;

  return async (
    invoice: { id: string; number: string },
    options: { download: boolean }
  ): Promise<void> => {
    try {
      const { document } = await queryClient.query(documentQuery(invoice.id));
      const data = toPdfData(document);
      const blob = await render(data);

      if (options.download) {
        saveBlob(blob, pdfFileName(data));
      }

      if (storage) {
        await uploadGeneratedPdf(invoice.id, blob, pdfFileName(data));
        await queryClient.invalidateQueries({ queryKey: financeKeys.all });
      }
    } catch (error) {
      console.error("Invoice PDF failed", error);

      // A renderer that didn't load already asked for a reload.
      if (!(error instanceof RendererUnavailableError)) {
        toast.error(t("invoices.editor.pdfFailed", { number: invoice.number }));
      }
    }
  };
};

/**
 * "Download PDF": the file stored when it was issued (opened in a tab made before any
 * request, so phones don't block it), or (without storage, or for invoices issued before) the
 * same PDF drawn again from the frozen data and saved.
 */
export const useDownloadInvoicePdf = () => {
  const { t } = useTranslation("finances");
  const queryClient = useQueryClient();
  const render = useInvoicePdfRenderer();
  const storage = useConfig().data?.photosEnabled === true;

  return async (invoice: { id: string }): Promise<void> => {
    const tab = storage ? openPendingTab() : null;

    try {
      if (tab !== null) {
        const { photos } = await queryClient.query(
          attachmentsQuery({
            ownerId: invoice.id,
            ownerType: "finance_invoice",
          })
        );

        const stored = photos.find((file) => file.generated);

        if (stored !== undefined) {
          tab.showUrl(stored.url);

          return;
        }

        tab.close();
      }

      const { document } = await queryClient.query(documentQuery(invoice.id));
      const data = toPdfData(document);
      saveBlob(await render(data), pdfFileName(data));
    } catch (error) {
      tab?.close();
      console.error("Invoice PDF download failed", error);

      if (!(error instanceof RendererUnavailableError)) {
        toast.error(t("invoices.editor.downloadFailed"));
      }
    }
  };
};
