import { GlobalWorkerOptions, PDFWorker, getDocument } from "pdfjs-dist";
// oxlint-disable-next-line import/default -- Vite's `?url` import gives the file's URL
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

/** One worker for every redraw (starting one per keystroke would be slow). */
let sharedWorker: PDFWorker | null = null;

/**
 * Draws every page of a PDF onto its own canvas, `width` CSS pixels wide (sharp on high-DPI
 * screens). The canvases are fully painted before this resolves, so they can replace the
 * previous ones in one step. Loaded with `import()` (it pulls in pdf.js).
 */
export const drawPdfPages = async (
  blob: Blob,
  width: number
): Promise<HTMLCanvasElement[]> => {
  sharedWorker ??= new PDFWorker();

  const task = getDocument({
    data: await blob.arrayBuffer(),
    worker: sharedWorker,
  });

  try {
    const pdf = await task.promise;
    const pixelRatio = window.devicePixelRatio || 1;

    const drawPage = async (number: number): Promise<HTMLCanvasElement> => {
      const page = await pdf.getPage(number);
      const unscaled = page.getViewport({ scale: 1 });

      const viewport = page.getViewport({
        scale: (width / unscaled.width) * pixelRatio,
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({ canvas, viewport }).promise;

      return canvas;
    };

    return await Promise.all(
      Array.from(
        { length: pdf.numPages },
        async (_, index) => await drawPage(index + 1)
      )
    );
  } finally {
    // Frees this document; the shared worker stays up for the next redraw.
    await task.destroy();
  }
};
