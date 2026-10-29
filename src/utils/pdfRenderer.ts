import * as pdfjsLib from 'pdfjs-dist';
// Vite URL import for pdf.worker
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize worker once
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl || '/pdf.worker.min.mjs';
}

export interface RenderedPdfPage {
  pageNumber: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

/**
 * Loads a PDF from an ArrayBuffer and returns the document proxy.
 */
export async function loadPdfDocument(data: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders a single PDF page to an offscreen canvas at specified scale (e.g. 1.0, 2.0).
 */
export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5
): Promise<RenderedPdfPage> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // White background for transparent PDF elements
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
    canvas,
  };

  await page.render(renderContext).promise;

  return {
    pageNumber,
    width: canvas.width,
    height: canvas.height,
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
  };
}
