import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import type { InvoicePdfData } from "../../../invoice-pdf/invoice-pdf-data";
import { useInvoicePdfRenderer } from "../../../invoice-pdf/use-invoice-pdf";

const DEBOUNCE_MS = 400;

/** Tailwind's `lg`: from here the editor has room for the preview beside the form. */
const PREVIEW_QUERY = "(min-width: 64rem)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PREVIEW_QUERY);
  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

/** Whether the live preview fits beside the form; narrower screens use the Preview button. */
export const usePreviewFits = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PREVIEW_QUERY).matches
  );

type PreviewState = "loading" | "ready" | "failed";

/** Pages are drawn at least this wide (CSS px) so a narrow pane still reads sharply. */
const MIN_PAGE_WIDTH = 480;

/** The page column's side padding (`p-6`), both sides. */
const PAGE_GUTTERS = 48;

/** Loads pdf.js (and its worker) on first use. */
const loadPageDrawer = async () => {
  const module = await import("../../../invoice-pdf/draw-pdf-pages");

  return module.drawPdfPages;
};

/**
 * The live A4 preview beside the editor (desktop): the same PDF component that draws the
 * final file, redrawn a moment after typing stops. `data` must keep its identity until the
 * content changes (memoise it).
 *
 * Pages are drawn with pdf.js onto canvases off screen and swapped in only once painted, so
 * the previous drawing stays put until the next one is ready (no viewer reload, no flash).
 */
export const InvoicePreview = ({ data }: { data: InvoicePdfData }) => {
  const { t } = useTranslation("finances");
  const render = useInvoicePdfRenderer();
  const [state, setState] = useState<PreviewState>("loading");
  const pane = useRef<HTMLElement>(null);
  const pages = useRef<HTMLDivElement>(null);

  const draw = useEffectEvent(
    async (next: InvoicePdfData, isCancelled: () => boolean) => {
      try {
        const [blob, drawPages] = await Promise.all([
          render(next),
          loadPageDrawer(),
        ]);

        if (isCancelled() || pane.current === null) {
          return;
        }

        const width = pane.current.clientWidth - PAGE_GUTTERS;

        const canvases = await drawPages(blob, Math.max(width, MIN_PAGE_WIDTH));

        const container = pages.current;

        if (isCancelled() || container === null) {
          return;
        }

        for (const canvas of canvases) {
          canvas.className = "bg-white h-auto w-full shadow-sm";
        }

        container.replaceChildren(...canvases);
        setState("ready");
      } catch (error) {
        console.error("Invoice preview failed", error);

        if (!isCancelled()) {
          setState("failed");
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
      className="bg-muted relative flex min-w-0 flex-1 flex-col overflow-y-auto"
      ref={pane}
    >
      {/* Filled with canvases outside React (see `draw`). */}
      <div
        className={cn("flex flex-col gap-4 p-6", state !== "ready" && "hidden")}
        ref={pages}
      />
      {state !== "ready" && (
        <p className="text-muted-foreground m-auto text-sm">
          {state === "failed"
            ? t("invoices.editor.previewFailed")
            : t("invoices.editor.previewLoading")}
        </p>
      )}
    </aside>
  );
};
