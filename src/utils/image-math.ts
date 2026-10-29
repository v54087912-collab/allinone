/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CropDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPreset = '1:1' | '4:5' | '16:9' | '9:16' | 'passport' | 'custom';

export interface SavedCrop {
  id: string;
  preset: AspectRatioPreset;
  cropBox: CropDimensions;
  width: number;
  height: number;
  thumbnailUrl: string;
  blob?: Blob;
  name: string;
}

export interface ImageCropItem {
  id: string;
  file: File;
  name: string;
  url: string;
  img: HTMLImageElement;
  originalWidth: number;
  originalHeight: number;
  crops: SavedCrop[];
  activeCropBox: CropDimensions;
  activePreset: AspectRatioPreset;
}

/**
 * Returns numerical aspect ratio width / height for a preset.
 * If custom, returns null (meaning unconstrained).
 */
export function getAspectRatioValue(preset: AspectRatioPreset): number | null {
  switch (preset) {
    case '1:1':
      return 1;
    case '4:5':
      return 4 / 5; // 0.8
    case '16:9':
      return 16 / 9; // ~1.7778
    case '9:16':
      return 9 / 16; // 0.5625
    case 'passport':
      // International standard ICAO 9303 (35mm x 45mm = 7:9)
      return 35 / 45; // ~0.7778
    case 'custom':
    default:
      return null;
  }
}

/**
 * Computes an initial centered crop box given image dimensions and aspect ratio preset.
 */
export function calculateInitialCropBox(
  imageWidth: number,
  imageHeight: number,
  preset: AspectRatioPreset
): CropDimensions {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const ratio = getAspectRatioValue(preset);

  if (ratio === null) {
    // Custom: default to 85% centered box
    const w = Math.max(20, Math.round(imageWidth * 0.85));
    const h = Math.max(20, Math.round(imageHeight * 0.85));
    return {
      x: Math.round((imageWidth - w) / 2),
      y: Math.round((imageHeight - h) / 2),
      width: w,
      height: h,
    };
  }

  const imgRatio = imageWidth / imageHeight;
  let cropW: number;
  let cropH: number;

  if (imgRatio > ratio) {
    cropH = Math.round(imageHeight * 0.9);
    cropW = Math.round(cropH * ratio);
  } else {
    cropW = Math.round(imageWidth * 0.9);
    cropH = Math.round(cropW / ratio);
  }

  cropW = Math.min(cropW, imageWidth);
  cropH = Math.min(cropH, imageHeight);

  const x = Math.max(0, Math.round((imageWidth - cropW) / 2));
  const y = Math.max(0, Math.round((imageHeight - cropH) / 2));

  return { x, y, width: cropW, height: cropH };
}

/**
 * Clamps crop box dimensions to guarantee it never exceeds original image bounds.
 */
export function clampCropBox(
  box: CropDimensions,
  imageWidth: number,
  imageHeight: number,
  ratio: number | null = null
): CropDimensions {
  let w = Math.max(20, Math.min(box.width, imageWidth));
  let h = Math.max(20, Math.min(box.height, imageHeight));

  if (ratio !== null && ratio > 0) {
    if (w / h > ratio) {
      w = Math.round(h * ratio);
    } else {
      h = Math.round(w / ratio);
    }
  }

  let x = Math.max(0, Math.min(box.x, imageWidth - w));
  let y = Math.max(0, Math.min(box.y, imageHeight - h));

  return { x, y, width: w, height: h };
}

/**
 * Computes constrained dimensions for images exceeding max allowed side (e.g. 1500px).
 */
export function calculateDownscaledDimensions(
  width: number,
  height: number,
  maxSide: number = 1500
): { width: number; height: number; scaled: boolean } {
  if (width <= 0 || height <= 0 || maxSide <= 0) return { width, height, scaled: false };
  const longest = Math.max(width, height);
  if (longest <= maxSide) {
    return { width, height, scaled: false };
  }
  const factor = maxSide / longest;
  return {
    width: Math.round(width * factor),
    height: Math.round(height * factor),
    scaled: true,
  };
}

/**
 * Formats bytes to human-readable string (e.g. 1.2 MB, 450 KB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Calculates percentage savings between original and compressed size.
 */
export function calculateSavings(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0) return 0;
  const diff = originalBytes - compressedBytes;
  if (diff <= 0) return 0;
  return Math.round((diff / originalBytes) * 100);
}

/**
 * Generates clean output filename for multiple crops of an image.
 * e.g. photo-crop-1.jpg, photo-crop-2.jpg
 */
export function generateCropFilename(
  originalName: string,
  cropIndex: number,
  extension: string = 'jpg',
  preset?: string
): string {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const cleanExt = extension.replace(/^\./, '').toLowerCase();
  const presetSuffix = preset ? `-${preset.replace(':', 'x')}` : '';
  return `${baseName}-crop-${cropIndex}${presetSuffix}.${cleanExt}`;
}

/**
 * Generates clean output filename with new extension and suffix.
 */
export function generateOutputFilename(
  originalName: string,
  suffix: string = '-processed',
  newExtension?: string
): string {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const originalExt = dotIndex !== -1 ? originalName.slice(dotIndex + 1).toLowerCase() : 'png';
  const ext = newExtension ? newExtension.replace(/^\./, '') : originalExt;
  return `${baseName}${suffix}.${ext}`;
}
