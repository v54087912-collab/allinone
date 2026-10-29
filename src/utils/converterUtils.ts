/**
 * Image Conversion Utilities
 */

export interface ConversionOptions {
  format: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp';
  quality: number; // 0.1 to 1.0
  backgroundColor?: string; // e.g. '#ffffff' for transparent PNG -> JPEG
}

export const SUPPORTED_TARGET_FORMATS = [
  { mime: 'image/png', label: 'PNG (Lossless, Transparent)', extension: 'png' },
  { mime: 'image/jpeg', label: 'JPG / JPEG (Standard)', extension: 'jpg' },
  { mime: 'image/webp', label: 'WebP (Modern, High Compression)', extension: 'webp' },
  { mime: 'image/bmp', label: 'BMP (Bitmap)', extension: 'bmp' },
] as const;

export function formatToExtension(mime: string): string {
  switch (mime.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/bmp':
      return 'bmp';
    case 'image/png':
    default:
      return 'png';
  }
}

export function extensionToMime(ext: string): string {
  const clean = ext.replace(/^\./, '').toLowerCase();
  switch (clean) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'png':
    default:
      return 'image/png';
  }
}

export function generateConvertedFilename(originalName: string, targetMime: string): string {
  const base = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const ext = formatToExtension(targetMime);
  return `${base}.${ext}`;
}

/**
 * Creates a canvas with optional background fill (for JPEG/BMP conversions)
 */
export function renderImageToCanvas(
  image: HTMLImageElement | ImageBitmap,
  backgroundColor?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(image, 0, 0);
  return canvas;
}
