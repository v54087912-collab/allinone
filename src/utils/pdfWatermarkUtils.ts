/**
 * PDF Watermark Utility Functions
 * Supports:
 * - Adding text watermarks with custom font, opacity, rotation angle, and color
 * - Adding image/logo watermarks
 * - Filtering target pages (all, odd, even, range)
 */
import { PDFDocument, StandardFonts, degrees, rgb, type PDFImage } from 'pdf-lib';
import { parsePageRange } from './pdfUtils.ts';
import { sanitizeWinAnsiText } from './wordToPdfUtils.ts';

export interface PdfWatermarkConfig {
  type: 'text' | 'image';
  text?: string;
  fontSize?: number; // 24 to 120 pt
  color?: { r: number; g: number; b: number };
  opacity?: number; // 0 to 1
  rotation?: number; // degrees (e.g. 45)
  imageBytes?: Uint8Array;
  imageFormat?: 'png' | 'jpg';
  pagesSelection?: 'all' | 'odd' | 'even' | 'custom';
  customRange?: string;
}

/**
 * Applies a watermark across selected pages of a PDFDocument.
 */
export async function applyPdfWatermark(
  pdfDoc: PDFDocument,
  config: PdfWatermarkConfig
): Promise<void> {
  const totalPages = pdfDoc.getPageCount();
  const opacity = config.opacity ?? 0.35;
  const rotDegrees = degrees(config.rotation ?? 45);

  let embeddedImage: PDFImage | null = null;
  if (config.type === 'image' && config.imageBytes) {
    if (config.imageFormat === 'jpg') {
      embeddedImage = await pdfDoc.embedJpg(config.imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedPng(config.imageBytes);
    }
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = config.fontSize ?? 48;
  const textColor = config.color
    ? rgb(config.color.r / 255, config.color.g / 255, config.color.b / 255)
    : rgb(0.85, 0.15, 0.15); // default bold red watermark

  // Resolve target pages
  let targetIndices: number[] = [];
  if (config.pagesSelection === 'odd') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 === 1);
  } else if (config.pagesSelection === 'even') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 === 0);
  } else if (config.pagesSelection === 'custom') {
    const pages1Based = parsePageRange(config.customRange || '', totalPages);
    targetIndices = pages1Based.map((p) => p - 1);
  } else {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  }

  for (const pageIdx of targetIndices) {
    if (pageIdx < 0 || pageIdx >= totalPages) continue;
    const page = pdfDoc.getPage(pageIdx);
    const { width: pW, height: pH } = page.getSize();

    if (config.type === 'text') {
      const text = sanitizeWinAnsiText((config.text || 'CONFIDENTIAL').trim());
      const textW = font.widthOfTextAtSize(text, fontSize);
      const textH = font.heightAtSize(fontSize);

      // Center placement with rotation
      page.drawText(text, {
        x: (pW - textW) / 2,
        y: (pH - textH) / 2,
        size: fontSize,
        font,
        color: textColor,
        opacity,
        rotate: rotDegrees,
      });
    } else if (embeddedImage) {
      const imgW = pW * 0.45;
      const imgH = (embeddedImage.height / embeddedImage.width) * imgW;

      page.drawImage(embeddedImage, {
        x: (pW - imgW) / 2,
        y: (pH - imgH) / 2,
        width: imgW,
        height: imgH,
        opacity,
        rotate: rotDegrees,
      });
    }
  }
}
