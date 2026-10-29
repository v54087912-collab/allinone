/**
 * Optical Character Recognition (OCR) Utility Functions
 * Supports:
 * - Image contrast and binarization preprocessing to dramatically boost OCR accuracy
 * - Text normalization and statistics (word count, line count)
 */

export interface OcrResult {
  text: string;
  confidence: number;
  wordCount: number;
  charCount: number;
  lineCount: number;
}

/**
 * Preprocesses an image on canvas for maximum OCR accuracy:
 * Converts to grayscale and enhances contrast / thresholding.
 */
export function preprocessImageForOcr(
  canvas: HTMLCanvasElement,
  threshold = 128
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray >= threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Calculates word, character, and line statistics from an OCR output string.
 */
export function calculateOcrStats(text: string): {
  wordCount: number;
  charCount: number;
  lineCount: number;
} {
  const clean = text.trim();
  if (!clean) {
    return { wordCount: 0, charCount: 0, lineCount: 0 };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);

  return {
    wordCount: words.length,
    charCount: clean.length,
    lineCount: lines.length,
  };
}

/**
 * Cleans raw OCR output by removing extraneous control characters and excessive trailing spaces.
 */
export function sanitizeOcrText(rawText: string): string {
  return rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}
