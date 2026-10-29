/**
 * PDF Rotation Utility Functions
 * Supports:
 * - Normalizing rotation angles (0, 90, 180, 270 degrees)
 * - Rotating individual pages or batch rotating all pages via pdf-lib
 */
import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Normalizes any positive or negative angle into standard PDF angles [0, 90, 180, 270].
 */
export function normalizeRotation(angle: number): number {
  let normalized = Math.round(angle) % 360;
  if (normalized < 0) normalized += 360;

  if (normalized >= 45 && normalized < 135) return 90;
  if (normalized >= 135 && normalized < 225) return 180;
  if (normalized >= 225 && normalized < 315) return 270;
  return 0;
}

/**
 * Rotates all pages in a PDF document by a given delta angle (e.g. +90 or -90).
 */
export function rotateAllPages(pdfDoc: PDFDocument, deltaAngle: number): void {
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    const currentRot = page.getRotation().angle;
    const newRot = normalizeRotation(currentRot + deltaAngle);
    page.setRotation(degrees(newRot));
  });
}

/**
 * Applies custom rotation degrees to specific pages (0-based page indices).
 */
export function applyPageRotations(
  pdfDoc: PDFDocument,
  rotationsMap: Map<number, number>
): void {
  const pages = pdfDoc.getPages();
  rotationsMap.forEach((newAngle, pageIdx) => {
    if (pageIdx >= 0 && pageIdx < pages.length) {
      const page = pages[pageIdx];
      page.setRotation(degrees(normalizeRotation(newAngle)));
    }
  });
}
