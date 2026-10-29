/**
 * Word to PDF Conversion Utility Functions
 * Supports:
 * - Word wrapping text strings to fit within page margins
 * - Paginated PDF generation from structured document paragraphs
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface DocParagraph {
  text: string;
  isHeading?: boolean;
}

export interface WordToPdfOptions {
  pageSize?: 'a4' | 'letter';
  margin?: number; // In points (default 40pt)
  fontSize?: number; // In points (default 11pt)
  lineSpacing?: number; // Multiplier (default 1.35)
}

/**
 * Word-wraps a string of text to fit within a given maxWidth using character approximation.
 */
export function wrapText(text: string, maxWidth: number, approxCharWidth: number): string[] {
  if (!text || maxWidth <= 0) return [''];

  const maxCharsPerLine = Math.max(10, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generates a clean PDF document from an array of document paragraphs.
 */
export async function convertParagraphsToPdf(
  paragraphs: DocParagraph[],
  options: WordToPdfOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('Toolora (100% In-Browser)');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const isA4 = options.pageSize !== 'letter';
  const pageW = isA4 ? 595.28 : 612;
  const pageH = isA4 ? 841.89 : 792;
  const margin = options.margin ?? 40;
  const availW = pageW - margin * 2;

  const bodyFontSize = options.fontSize ?? 11;
  const headingFontSize = bodyFontSize * 1.5;
  const bodyLineH = bodyFontSize * (options.lineSpacing ?? 1.35);
  const headingLineH = headingFontSize * 1.3;

  let currentPage = pdfDoc.addPage([pageW, pageH]);
  let currentY = pageH - margin;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageW, pageH]);
    currentY = pageH - margin;
  };

  for (const p of paragraphs) {
    if (!p.text.trim()) continue;

    const isHeading = !!p.isHeading;
    const currentFont = isHeading ? boldFont : font;
    const currentSize = isHeading ? headingFontSize : bodyFontSize;
    const lineH = isHeading ? headingLineH : bodyLineH;
    const approxCharW = currentSize * 0.52;

    const lines = wrapText(p.text, availW, approxCharW);

    // Extra spacing before heading
    if (isHeading && currentY < pageH - margin - 20) {
      currentY -= 12;
    }

    for (const line of lines) {
      if (currentY - lineH < margin) {
        addNewPage();
      }

      currentPage.drawText(line, {
        x: margin,
        y: currentY - lineH,
        size: currentSize,
        font: currentFont,
        color: isHeading ? rgb(0.08, 0.12, 0.2) : rgb(0.18, 0.22, 0.28),
      });

      currentY -= lineH;
    }

    // Paragraph gap
    currentY -= 8;
  }

  return await pdfDoc.save();
}
