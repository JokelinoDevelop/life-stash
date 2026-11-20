import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { InvoicePdfData } from "../../../invoice-pdf/invoice-pdf-data";
import { useInvoicePdfRenderer } from "../../../invoice-pdf/use-invoice-pdf";

const DEBOUNCE_MS = 400;

type PreviewState =
  | { kind: "loading" }
  | { kind: "ready"; blob: Blob; drawing: number }
  | { kind: "failed" };

/**
 * A drawn PDF. Mounted once per drawing (keyed), it points the object at a URL made for this
 * blob and revokes it when replaced or closed.
 */
const PdfObject = ({ blob, label }: { blob: Blob; label: string }) => {
  const element = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);

    if (element.current !== null) {
      element.current.data = `${url}#toolbar=0&navpanes=0&view=FitH`;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return (
    <object
      aria-label={label}
      className="h-full w-full"
      ref={element}
      type="application/pdf"
    >
      {label}
    </object>
  );
};

/**
 * The live A4 preview beside the editor (desktop): the same PDF component that draws the
 * final file, redrawn a moment after typing stops. `data` must keep its identity until the
 * content changes (memoise it).
 */
export const InvoicePreview = ({ data }: { data: InvoicePdfData }) => {
  const { t } = useTranslation("finances");
  const render = useInvoicePdfRenderer();
  const [state, setState] = useState<PreviewState>({ kind: "loading" });

  const draw = useEffectEvent(
    async (next: InvoicePdfData, isCancelled: () => boolean) => {
      try {
        const blob = await render(next);

        if (!isCancelled()) {
          setState((previous) => ({
            blob,
            drawing: previous.kind === "ready" ? previous.drawing + 1 : 1,
            kind: "ready",
          }));
        }
      } catch (error) {
        console.error("Invoice preview failed", error);

        if (!isCancelled()) {
          setState({ kind: "failed" });
        }
      }
    }
  );

  // Drawing happens outside React; redraw a moment after the content stops changing.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      void draw(data, () => cancelled);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data]);

  const label = t("invoices.editor.previewLabel");

  return (
    <aside
      aria-label={label}
      className="bg-background hidden min-w-0 flex-1 flex-col md:flex"
    >
      {state.kind === "ready" ? (
        <PdfObject blob={state.blob} key={state.drawing} label={label} />
      ) : (
        <p className="text-muted-foreground m-auto text-sm">
          {state.kind === "failed"
            ? t("invoices.editor.previewFailed")
            : t("invoices.editor.previewLoading")}
        </p>
      )}
    </aside>
  );
};
