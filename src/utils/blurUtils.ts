/**
 * Image Blur & Redaction Utility Functions
 * Supports:
 * - Fast box blur / Gaussian approximation
 * - Pixelate / Mosaic censor effect
 * - Bounding box region calculations (clamping, intersection, inverting)
 */

export interface BlurRegion {
  x: number;      // 0 to 1 normalized, or pixel value
  y: number;
  width: number;
  height: number;
}

export type BlurType = 'box' | 'gaussian' | 'pixelate';

/**
 * Clamps a region to stay strictly within [0, 0, imageWidth, imageHeight].
 */
export function clampRegion(
  region: { x: number; y: number; width: number; height: number },
  maxWidth: number,
  maxHeight: number
): { x: number; y: number; width: number; height: number } {
  let x = Math.max(0, Math.min(region.x, maxWidth));
  let y = Math.max(0, Math.min(region.y, maxHeight));
  let w = Math.max(1, Math.min(region.width, maxWidth - x));
  let h = Math.max(1, Math.min(region.height, maxHeight - y));

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(w),
    height: Math.round(h),
  };
}

/**
 * Applies a mosaic / pixelate effect to ImageData within a specified bounding box.
 */
export function applyPixelateToImageData(
  imageData: ImageData,
  region: { x: number; y: number; width: number; height: number },
  blockSize: number
): void {
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  const bSize = Math.max(2, Math.round(blockSize));
  const clamped = clampRegion(region, imgW, imgH);

  for (let startY = clamped.y; startY < clamped.y + clamped.height; startY += bSize) {
    for (let startX = clamped.x; startX < clamped.x + clamped.width; startX += bSize) {
      const endX = Math.min(startX + bSize, clamped.x + clamped.width);
      const endY = Math.min(startY + bSize, clamped.y + clamped.height);

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      // Calculate average color in block
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * imgW + x) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          aSum += data[idx + 3];
          count++;
        }
      }

      if (count === 0) continue;

      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);
      const avgA = Math.round(aSum / count);

      // Fill block with average color
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * imgW + x) * 4;
          data[idx] = avgR;
          data[idx + 1] = avgG;
          data[idx + 2] = avgB;
          data[idx + 3] = avgA;
        }
      }
    }
  }
}

/**
 * Applies a fast 1D horizontal and vertical box blur to an ImageData region.
 */
export function applyBoxBlurToImageData(
  imageData: ImageData,
  region: { x: number; y: number; width: number; height: number },
  radius: number
): void {
  const r = Math.max(1, Math.round(radius));
  const clamped = clampRegion(region, imageData.width, imageData.height);
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  // Clone buffer to sample from original pixels
  const copy = new Uint8ClampedArray(data);

  // Horizontal blur pass
  for (let y = clamped.y; y < clamped.y + clamped.height; y++) {
    for (let x = clamped.x; x < clamped.x + clamped.width; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      const xMin = Math.max(clamped.x, x - r);
      const xMax = Math.min(clamped.x + clamped.width - 1, x + r);

      for (let kx = xMin; kx <= xMax; kx++) {
        const idx = (y * imgW + kx) * 4;
        rSum += copy[idx];
        gSum += copy[idx + 1];
        bSum += copy[idx + 2];
        aSum += copy[idx + 3];
        count++;
      }

      const outIdx = (y * imgW + x) * 4;
      data[outIdx] = Math.round(rSum / count);
      data[outIdx + 1] = Math.round(gSum / count);
      data[outIdx + 2] = Math.round(bSum / count);
      data[outIdx + 3] = Math.round(aSum / count);
    }
  }

  // Update copy for vertical pass
  copy.set(data);

  // Vertical blur pass
  for (let y = clamped.y; y < clamped.y + clamped.height; y++) {
    for (let x = clamped.x; x < clamped.x + clamped.width; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      const yMin = Math.max(clamped.y, y - r);
      const yMax = Math.min(clamped.y + clamped.height - 1, y + r);

      for (let ky = yMin; ky <= yMax; ky++) {
        const idx = (ky * imgW + x) * 4;
        rSum += copy[idx];
        gSum += copy[idx + 1];
        bSum += copy[idx + 2];
        aSum += copy[idx + 3];
        count++;
      }

      const outIdx = (y * imgW + x) * 4;
      data[outIdx] = Math.round(rSum / count);
      data[outIdx + 1] = Math.round(gSum / count);
      data[outIdx + 2] = Math.round(bSum / count);
      data[outIdx + 3] = Math.round(aSum / count);
    }
  }
}
