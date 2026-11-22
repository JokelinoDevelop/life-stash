import { invoiceFileName } from "@shared/domain/finances/invoice-document";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { InvoicePdfData } from "./invoice-pdf-data";
import { invoicePdfLabels } from "./invoice-pdf-labels";

/** The renderer chunk didn't load: after a deploy the old file is gone, and only a reload helps. */
export class RendererUnavailableError extends Error {
  override name = "RendererUnavailableError";
}

/** Loads the PDF renderer (with `@react-pdf/renderer` and the fonts) on first use. */
const loadRenderer = async () => {
  try {
    const module = await import("./render-invoice-pdf");

    return module.renderInvoicePdf;
  } catch (error) {
    // The chunk isn't precached (it's large), so a tab left open across a deploy asks for a
    // file that no longer exists.
    throw new RendererUnavailableError("The invoice PDF renderer didn't load", {
      cause: error,
    });
  }
};

/** Draws invoice PDFs in the invoice's language. */
export const useInvoicePdfRenderer = () => {
  const { i18n, t } = useTranslation("finances");
  const { t: tc } = useTranslation();

  return async (data: InvoicePdfData): Promise<Blob> => {
    try {
      const renderInvoicePdf = await loadRenderer();

      return await renderInvoicePdf(
        data,
        invoicePdfLabels(i18n, data.language)
      );
    } catch (error) {
      if (error instanceof RendererUnavailableError) {
        toast.error(t("invoices.editor.rendererUnavailable"), {
          action: {
            label: tc("update.reload"),
            onClick: () => {
              window.location.reload();
            },
          },
          duration: Number.POSITIVE_INFINITY,
          id: "invoice-pdf-renderer",
        });
      }

      throw error;
    }
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

export interface PendingTab {
  /** Shows the drawn PDF in the tab (or this page when the tab was blocked). */
  showBlob: (blob: Blob) => void;
  /** Points the tab at a stored file. */
  showUrl: (url: string) => void;
  /** Closes the tab when there is nothing to show (it failed, or the file was saved instead). */
  close: () => void;
}

/**
 * Opens a tab right away, while the tap still counts as a user gesture (Safari and iOS block
 * tabs opened after an `await`), and fills it once the PDF is ready.
 */
export const openPendingTab = (): PendingTab => {
  const tab = window.open("about:blank", "_blank");

  const showUrl = (url: string) => {
    if (tab === null) {
      window.location.assign(url);
    } else {
      tab.location.href = url;
    }
  };

  return {
    close: () => {
      tab?.close();
    },
    showBlob: (blob) => {
      const url = URL.createObjectURL(blob);
      showUrl(url);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    },
    showUrl,
  };
};
