/**
 * PDF Page Numbering Utility Functions
 * Supports:
 * - Template formatting: "{page}", "Page {page} of {total}", "- {page} -"
 * - Coordinate placement calculations (bottom-center, bottom-right, etc.)
 * - Applying page numbers to all or selected PDF pages using pdf-lib
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { parsePageRange } from './pdfUtils.ts';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export interface PageNumberConfig {
  format: string; // e.g. "Page {page} of {total}" or "{page}" or "- {page} -"
  position: PageNumberPosition;
  fontSize: number; // 9 to 16 pt
  margin: number; // In points from edge (e.g. 24, 36)
  startNumber: number; // default 1
  pagesRange?: string; // e.g. "2-" to skip cover page, or empty for all
  color?: { r: number; g: number; b: number };
}

/**
 * Formats a page number string based on a template.
 */
export function formatPageNumberText(
  template: string,
  pageNumber: number,
  totalPages: number
): string {
  return template
    .replace(/\{page\}/gi, String(pageNumber))
    .replace(/\{n\}/gi, String(pageNumber))
    .replace(/\{total\}/gi, String(totalPages));
}

/**
 * Calculates (x, y) coordinates for the page number text in PDF coordinate space (bottom-left 0,0).
 */
export function calculatePageNumberCoords(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  position: PageNumberPosition,
  margin = 30
): { x: number; y: number } {
  let x = margin;
  let y = margin;

  switch (position) {
    case 'bottom-center':
      x = (pageWidth - textWidth) / 2;
      y = margin;
      break;
    case 'bottom-right':
      x = pageWidth - textWidth - margin;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = margin;
      break;
    case 'top-center':
      x = (pageWidth - textWidth) / 2;
      y = pageHeight - margin - textHeight;
      break;
    case 'top-right':
      x = pageWidth - textWidth - margin;
      y = pageHeight - margin - textHeight;
      break;
    case 'top-left':
      x = margin;
      y = pageHeight - margin - textHeight;
      break;
  }

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Stamps formatted page numbers onto a PDFDocument.
 */
export async function stampPageNumbers(
  pdfDoc: PDFDocument,
  config: PageNumberConfig
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();
  const targetPages = parsePageRange(config.pagesRange || '', totalPages);
  const targetSet = new Set(targetPages);

  const textColor = config.color
    ? rgb(config.color.r / 255, config.color.g / 255, config.color.b / 255)
    : rgb(0.2, 0.25, 0.3);

  for (let i = 0; i < totalPages; i++) {
    const pageIndex = i;
    const page1Based = pageIndex + 1;

    if (!targetSet.has(page1Based)) continue;

    const page = pdfDoc.getPage(pageIndex);
    const { width: pWidth, height: pHeight } = page.getSize();

    const displayNum = config.startNumber + (page1Based - 1);
    const text = formatPageNumberText(config.format, displayNum, totalPages);
    const textWidth = font.widthOfTextAtSize(text, config.fontSize);
    const textHeight = font.heightAtSize(config.fontSize);

    const coords = calculatePageNumberCoords(
      pWidth,
      pHeight,
      textWidth,
      textHeight,
      config.position,
      config.margin
    );

    page.drawText(text, {
      x: coords.x,
      y: coords.y,
      size: config.fontSize,
      font,
      color: textColor,
    });
  }
}
