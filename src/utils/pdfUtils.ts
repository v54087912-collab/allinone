/**
 * PDF Processing Utility Functions
 * Supports:
 * - Page range parsing and validation
 * - Coordinate transformations between Screen space (top-left 0,0) and PDF space (bottom-left 0,0)
 * - Page sizing, orientation, and image placement calculations
 * - Split filename generation
 */

export interface PageDimension {
  width: number;
  height: number;
}

export const STANDARD_PAGE_SIZES: Record<string, PageDimension> = {
  a4: { width: 595.28, height: 841.89 }, // 210 x 297 mm
  letter: { width: 612, height: 792 },   // 8.5 x 11 in
  legal: { width: 612, height: 1008 },  // 8.5 x 14 in
};

export const MARGIN_PRESETS: Record<string, number> = {
  none: 0,
  small: 20,   // ~7mm
  normal: 36,  // ~12.7mm (0.5 in)
  large: 54,   // ~19mm
};

export type OrientationMode = 'auto' | 'portrait' | 'landscape';
export type ImageFitMode = 'contain' | 'cover' | 'original';

export interface ImageToPdfConfig {
  pageSize: 'a4' | 'letter' | 'legal' | 'fit';
  orientation: OrientationMode;
  margin: 'none' | 'small' | 'normal' | 'large';
  fit: ImageFitMode;
}

export interface ImagePlacementResult {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Parses user input page range strings (e.g. "1-3, 5, 8-10") into a unique, sorted list of 1-based page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    // Empty means all pages
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pagesSet.add(page);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Validates a page range string against a document's total page count.
 */
export function validatePageRange(rangeStr: string, totalPages: number): {
  valid: boolean;
  error?: string;
  pages: number[];
} {
  if (totalPages <= 0) {
    return { valid: false, error: 'Document has no pages', pages: [] };
  }

  const trimmed = (rangeStr || '').trim();
  if (!trimmed) {
    return {
      valid: true,
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    };
  }

  // Check for invalid characters
  if (!/^[\d\s,\-;]+$/.test(trimmed)) {
    return { valid: false, error: 'Only numbers, commas, and hyphens are allowed', pages: [] };
  }

  const pages = parsePageRange(trimmed, totalPages);
  if (pages.length === 0) {
    return { valid: false, error: `No valid pages found between 1 and ${totalPages}`, pages: [] };
  }

  return { valid: true, pages };
}

/**
 * Groups pages into chunks of N pages (for "Split every N pages" mode).
 */
export function chunkPagesEveryN(totalPages: number, n: number): number[][] {
  const step = Math.max(1, Math.floor(n));
  const chunks: number[][] = [];
  for (let i = 1; i <= totalPages; i += step) {
    const chunk: number[] = [];
    for (let j = i; j < i + step && j <= totalPages; j++) {
      chunk.push(j);
    }
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Calculates page dimensions and image placement coordinates for Image-to-PDF.
 */
export function calculateImagePlacement(
  imageWidth: number,
  imageHeight: number,
  config: ImageToPdfConfig
): ImagePlacementResult {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { pageWidth: 595, pageHeight: 842, x: 0, y: 0, width: 0, height: 0 };
  }

  // 1. Determine base page dimensions
  let pageWidth = 595.28;
  let pageHeight = 841.89;

  if (config.pageSize === 'fit') {
    // Match image dimensions exactly with margin = 0
    return {
      pageWidth: imageWidth,
      pageHeight: imageHeight,
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
    };
  }

  const baseStandard = STANDARD_PAGE_SIZES[config.pageSize] || STANDARD_PAGE_SIZES.a4;
  pageWidth = baseStandard.width;
  pageHeight = baseStandard.height;

  // 2. Adjust for orientation
  let isLandscape = false;
  if (config.orientation === 'auto') {
    isLandscape = imageWidth > imageHeight;
  } else if (config.orientation === 'landscape') {
    isLandscape = true;
  }

  if (isLandscape && pageWidth < pageHeight) {
    const tmp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = tmp;
  } else if (!isLandscape && pageWidth > pageHeight) {
    const tmp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = tmp;
  }

  // 3. Compute printable area with margins
  const margin = MARGIN_PRESETS[config.margin] ?? 0;
  const availWidth = Math.max(10, pageWidth - margin * 2);
  const availHeight = Math.max(10, pageHeight - margin * 2);

  let drawWidth = availWidth;
  let drawHeight = availHeight;

  if (config.fit === 'contain') {
    const scale = Math.min(availWidth / imageWidth, availHeight / imageHeight);
    drawWidth = imageWidth * scale;
    drawHeight = imageHeight * scale;
  } else if (config.fit === 'cover') {
    const scale = Math.max(availWidth / imageWidth, availHeight / imageHeight);
    drawWidth = imageWidth * scale;
    drawHeight = imageHeight * scale;
  } else if (config.fit === 'original') {
    // Keep 1:1 pt (72 DPI) if fits, otherwise downscale
    const scale = Math.min(1, availWidth / imageWidth, availHeight / imageHeight);
    drawWidth = imageWidth * scale;
    drawHeight = imageHeight * scale;
  }

  // Center on page
  const x = margin + (availWidth - drawWidth) / 2;
  const y = margin + (availHeight - drawHeight) / 2;

  return {
    pageWidth,
    pageHeight,
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  };
}

/**
 * Normalized crop rectangle on canvas [0, 1] relative to top-left.
 */
export interface NormalizedCropRect {
  x: number;      // 0 to 1
  y: number;      // 0 to 1
  width: number;  // 0 to 1
  height: number; // 0 to 1
}

/**
 * PDF Box in PDF coordinates [lowerLeftX, lowerLeftY, upperRightX, upperRightY]
 */
export interface PdfBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transforms a normalized screen crop rect (top-left origin) to PDF coordinates (bottom-left origin).
 * Handles MediaBox offsets where mediaBox might start at [x, y] instead of [0, 0].
 */
export function calculatePdfCropBox(
  mediaBox: { x: number; y: number; width: number; height: number },
  normCrop: NormalizedCropRect
): { x: number; y: number; width: number; height: number } {
  // Clamp normCrop to 0..1
  const normX = Math.max(0, Math.min(1, normCrop.x));
  const normY = Math.max(0, Math.min(1, normCrop.y));
  const normW = Math.max(0.01, Math.min(1 - normX, normCrop.width));
  const normH = Math.max(0.01, Math.min(1 - normY, normCrop.height));

  const pdfW = mediaBox.width * normW;
  const pdfH = mediaBox.height * normH;

  // Screen Y goes downward from top; PDF Y goes upward from bottom
  const pdfX = mediaBox.x + mediaBox.width * normX;
  const pdfY = mediaBox.y + mediaBox.height * (1 - (normY + normH));

  return {
    x: Math.round(pdfX * 100) / 100,
    y: Math.round(pdfY * 100) / 100,
    width: Math.round(pdfW * 100) / 100,
    height: Math.round(pdfH * 100) / 100,
  };
}

/**
 * Generates clean output filename for split PDFs.
 */
export function generateSplitFilename(
  originalFilename: string,
  pages: number[],
  chunkIndex?: number,
  totalChunks?: number
): string {
  const base = originalFilename.replace(/\.pdf$/i, '') || 'document';

  if (pages.length === 1) {
    return `${base}_page_${pages[0]}.pdf`;
  }

  // Check if pages are sequential
  const isSequential = pages.every((p, idx) => idx === 0 || p === pages[idx - 1] + 1);
  if (isSequential && pages.length > 1) {
    return `${base}_pages_${pages[0]}-${pages[pages.length - 1]}.pdf`;
  }

  if (chunkIndex !== undefined && totalChunks !== undefined) {
    return `${base}_part_${chunkIndex + 1}_of_${totalChunks}.pdf`;
  }

  return `${base}_extracted.pdf`;
}

/**
 * Detects whether a byte array starts with a valid JPEG SOI (Start Of Image) marker (0xFF, 0xD8).
 */
export function isJpegBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xD8;
}

/**
 * Detects whether a byte array starts with a valid PNG magic number (0x89, 0x50, 0x4E, 0x47).
 */
export function isPngBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47
  );
}
