import { CropRect, ResizeHandle } from '../types/crop';

/**
 * Normalizes two diagonal drag coordinates into a standard rectangle.
 */
export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return { x, y, width, height };
}

/**
 * Clamps a crop rectangle to stay strictly within image boundaries [0, 0, imgW, imgH]
 * and satisfy minimum dimensions.
 */
export function clampCrop(
  crop: { x: number; y: number; width: number; height: number },
  imgW: number,
  imgH: number,
  minSize = 4
): { x: number; y: number; width: number; height: number } {
  const safeImgW = Math.max(1, imgW);
  const safeImgH = Math.max(1, imgH);

  let width = Math.max(minSize, Math.round(crop.width));
  let height = Math.max(minSize, Math.round(crop.height));

  width = Math.min(width, safeImgW);
  height = Math.min(height, safeImgH);

  let x = Math.round(crop.x);
  let y = Math.round(crop.y);

  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + width > safeImgW) x = safeImgW - width;
  if (y + height > safeImgH) y = safeImgH - height;

  return { x, y, width, height };
}

/**
 * Resizes a crop rectangle according to which handle is being dragged.
 */
export function resizeCrop(
  initial: { x: number; y: number; width: number; height: number },
  handle: ResizeHandle,
  dx: number,
  dy: number,
  imgW: number,
  imgH: number,
  minSize = 4
): { x: number; y: number; width: number; height: number } {
  let left = initial.x;
  let top = initial.y;
  let right = initial.x + initial.width;
  let bottom = initial.y + initial.height;

  // Handle horizontal adjustments
  if (handle.includes('w')) {
    left = Math.min(right - minSize, Math.max(0, initial.x + dx));
  } else if (handle.includes('e')) {
    right = Math.max(left + minSize, Math.min(imgW, initial.x + initial.width + dx));
  }

  // Handle vertical adjustments
  if (handle.includes('n')) {
    top = Math.min(bottom - minSize, Math.max(0, initial.y + dy));
  } else if (handle.includes('s')) {
    bottom = Math.max(top + minSize, Math.min(imgH, initial.y + initial.height + dy));
  }

  return {
    x: Math.round(left),
    y: Math.round(top),
    width: Math.round(right - left),
    height: Math.round(bottom - top),
  };
}

/**
 * Checks if a point in image coordinates falls inside a crop rectangle.
 */
export function isPointInCrop(px: number, py: number, crop: CropRect): boolean {
  return (
    px >= crop.x &&
    px <= crop.x + crop.width &&
    py >= crop.y &&
    py <= crop.y + crop.height
  );
}

/**
 * Sanitizes a filename, removing invalid characters and whitespace.
 */
export function sanitizeFilename(name: string, fallbackIndex = 1): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!cleaned) {
    return String(fallbackIndex);
  }
  return cleaned;
}

/**
 * Ensures a list of filenames has unique names with incrementing suffixes.
 */
export function generateUniqueFilenames(crops: CropRect[]): Map<string, string> {
  const result = new Map<string, string>();
  const nameCounts = new Map<string, number>();

  crops.forEach((crop, idx) => {
    let raw = (crop.name || String(idx + 1)).trim();
    if (raw.toLowerCase().endsWith('.png')) {
      raw = raw.slice(0, -4);
    }
    const base = sanitizeFilename(raw, idx + 1);
    const count = nameCounts.get(base) || 0;
    nameCounts.set(base, count + 1);

    if (count === 0) {
      result.set(crop.id, `${base}.png`);
    } else {
      result.set(crop.id, `${base}_${count}.png`);
    }
  });

  return result;
}
