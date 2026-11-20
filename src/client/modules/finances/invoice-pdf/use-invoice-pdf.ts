import { invoiceFileName } from "@shared/domain/finances/invoice-document";
import { useTranslation } from "react-i18next";

import type { InvoicePdfData } from "./invoice-pdf-data";
import { invoicePdfLabels } from "./invoice-pdf-labels";

/** Loads the PDF renderer (with `@react-pdf/renderer` and the fonts) on first use. */
const loadRenderer = async () => {
  const module = await import("./render-invoice-pdf");

  return module.renderInvoicePdf;
};

/** Draws invoice PDFs in the invoice's language. */
export const useInvoicePdfRenderer = () => {
  const { i18n } = useTranslation();

  return async (data: InvoicePdfData): Promise<Blob> => {
    const renderInvoicePdf = await loadRenderer();

    return await renderInvoicePdf(data, invoicePdfLabels(i18n, data.language));
  };
};

/** `Invoice-2026-012.pdf` / `Faktura-2026-012.pdf`. */
export const pdfFileName = (data: InvoicePdfData): string =>
  invoiceFileName(data.number ?? "draft", data.language);

/** Saves a blob as a file through a temporary link. */
export const saveBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
};

/**
 * Opens a tab right away (while the tap still counts as a user gesture, so it isn't blocked)
 * and returns a function that shows the PDF in it once drawn.
 */
export const openPendingTab = (): ((blob: Blob) => void) => {
  const tab = window.open("about:blank", "_blank");

  return (blob) => {
    const url = URL.createObjectURL(blob);

    if (tab === null) {
      window.location.assign(url);
    } else {
      tab.location.href = url;
    }

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  };
};
