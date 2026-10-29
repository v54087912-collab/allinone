import { CropRect } from '../types/crop';

export interface DetectionPixelBuffer {
  data: ArrayLike<number>; // RGBA values [r, g, b, a, ...]
  width: number;
  height: number;
}

export interface ObjectDetectionOptions {
  threshold?: number; // 5 to 150 (contrast distance from background, default ~35)
  minWidth?: number; // minimum width in px (default 12)
  minHeight?: number; // minimum height in px (default 12)
  minArea?: number; // minimum area in px² (default 100)
  padding?: number; // padding in px added to bounding box (default 4)
  mergeDistance?: number; // merge bounding boxes closer than this (default 8)
  bgMode?: 'auto' | 'white' | 'black' | 'transparent';
}

export interface DetectedBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
}

/**
 * Detect dominant background color from the corners and border pixels of the image.
 */
export function detectBackgroundColor(
  buffer: DetectionPixelBuffer,
  mode: 'auto' | 'white' | 'black' | 'transparent' = 'auto'
): { r: number; g: number; b: number; isTransparent: boolean } {
  if (mode === 'white') return { r: 255, g: 255, b: 255, isTransparent: false };
  if (mode === 'black') return { r: 0, g: 0, b: 0, isTransparent: false };
  if (mode === 'transparent') return { r: 0, g: 0, b: 0, isTransparent: true };

  const { data, width, height } = buffer;

  // Sample corner points and outer edges
  const sampleIndices: number[] = [];

  const addPixel = (px: number, py: number) => {
    if (px >= 0 && px < width && py >= 0 && py < height) {
      sampleIndices.push((py * width + px) * 4);
    }
  };

  // 4 corners (plus 3x3 surrounding corner pixels)
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      addPixel(dx, dy);
      addPixel(width - 1 - dx, dy);
      addPixel(dx, height - 1 - dy);
      addPixel(width - 1 - dx, height - 1 - dy);
    }
  }

  // Also sample along middle of 4 edges
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  addPixel(midX, 0);
  addPixel(midX, height - 1);
  addPixel(0, midY);
  addPixel(width - 1, midY);

  let transparentCount = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let opaqueCount = 0;

  for (const idx of sampleIndices) {
    const a = data[idx + 3];
    if (a < 20) {
      transparentCount++;
    } else {
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      opaqueCount++;
    }
  }

  // If majority of border samples are transparent, background is transparent
  if (transparentCount > sampleIndices.length * 0.4) {
    return { r: 0, g: 0, b: 0, isTransparent: true };
  }

  if (opaqueCount === 0) {
    return { r: 255, g: 255, b: 255, isTransparent: false };
  }

  return {
    r: Math.round(totalR / opaqueCount),
    g: Math.round(totalG / opaqueCount),
    b: Math.round(totalB / opaqueCount),
    isTransparent: false,
  };
}

/**
 * Calculates color distance between a pixel and the background.
 */
export function getColorDistance(
  r: number,
  g: number,
  b: number,
  a: number,
  bg: { r: number; g: number; b: number; isTransparent: boolean }
): number {
  if (bg.isTransparent) {
    return a; // high alpha means high contrast from transparent
  }

  if (a < 20) {
    // Transparent pixel against non-transparent background is contrast
    return 255;
  }

  // Perceptual color distance
  const dr = r - bg.r;
  const dg = g - bg.g;
  const db = b - bg.b;
  return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
}

/**
 * Merge boxes that overlap or are within mergeDistance of each other.
 */
export function mergeCloseBoxes(boxes: DetectedBox[], mergeDistance: number): DetectedBox[] {
  if (boxes.length <= 1) return boxes;

  const results: DetectedBox[] = [];
  const merged = new Array(boxes.length).fill(false);

  for (let i = 0; i < boxes.length; i++) {
    if (merged[i]) continue;

    let b1 = { ...boxes[i] };
    let hasMerged = true;

    while (hasMerged) {
      hasMerged = false;
      for (let j = 0; j < boxes.length; j++) {
        if (i === j || merged[j]) continue;

        const b2 = boxes[j];

        // Check if b1 and b2 are within mergeDistance
        const overlaps =
          b1.x - mergeDistance <= b2.x + b2.width &&
          b1.x + b1.width + mergeDistance >= b2.x &&
          b1.y - mergeDistance <= b2.y + b2.height &&
          b1.y + b1.height + mergeDistance >= b2.y;

        if (overlaps) {
          const newX = Math.min(b1.x, b2.x);
          const newY = Math.min(b1.y, b2.y);
          const newMaxX = Math.max(b1.x + b1.width, b2.x + b2.width);
          const newMaxY = Math.max(b1.y + b1.height, b2.y + b2.height);

          b1.x = newX;
          b1.y = newY;
          b1.width = newMaxX - newX;
          b1.height = newMaxY - newY;
          b1.pixelCount += b2.pixelCount;

          merged[j] = true;
          hasMerged = true;
        }
      }
    }

    results.push(b1);
  }

  return results;
}

/**
 * Heuristic threshold-based object detection using connected-component analysis.
 */
export function detectObjectsFromPixels(
  buffer: DetectionPixelBuffer,
  options: ObjectDetectionOptions = {}
): DetectedBox[] {
  const {
    threshold = 35,
    minWidth = 12,
    minHeight = 12,
    minArea = 100,
    padding = 4,
    mergeDistance = 8,
    bgMode = 'auto',
  } = options;

  const { data, width, height } = buffer;
  if (width <= 0 || height <= 0 || data.length === 0) return [];

  const bg = detectBackgroundColor(buffer, bgMode);

  // Downsample grid scale if image is very large to keep computation sub-100ms
  const scale = width > 1600 || height > 1600 ? 2 : 1;
  const gridW = Math.ceil(width / scale);
  const gridH = Math.ceil(height / scale);

  // Binary foreground mask (1 = foreground, 0 = background)
  const mask = new Uint8Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    const py = Math.min(gy * scale, height - 1);
    for (let gx = 0; gx < gridW; gx++) {
      const px = Math.min(gx * scale, width - 1);
      const idx = (py * width + px) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      const dist = getColorDistance(r, g, b, a, bg);
      if (dist >= threshold) {
        mask[gy * gridW + gx] = 1;
      }
    }
  }

  // Connected Component Labeling using Breadth-First Search (BFS)
  const visited = new Uint8Array(gridW * gridH);
  const rawBoxes: DetectedBox[] = [];

  const queueX = new Int32Array(gridW * gridH);
  const queueY = new Int32Array(gridW * gridH);

  let boxCounter = 1;

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const startIdx = y * gridW + x;
      if (mask[startIdx] === 0 || visited[startIdx] === 1) {
        continue;
      }

      // Start new connected component
      visited[startIdx] = 1;
      let qHead = 0;
      let qTail = 0;

      queueX[qTail] = x;
      queueY[qTail] = y;
      qTail++;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;

      while (qHead < qTail) {
        const cx = queueX[qHead];
        const cy = queueY[qHead];
        qHead++;
        count++;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // 4-neighborhood
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
            const nIdx = ny * gridW + nx;
            if (mask[nIdx] === 1 && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              queueX[qTail] = nx;
              queueY[qTail] = ny;
              qTail++;
            }
          }
        }
      }

      // Convert back to original image space
      const origX = minX * scale;
      const origY = minY * scale;
      const origW = (maxX - minX + 1) * scale;
      const origH = (maxY - minY + 1) * scale;
      const origArea = origW * origH;

      // Filter noise
      if (origW >= minWidth && origH >= minHeight && origArea >= minArea) {
        // Ignore if covers almost the entire image (e.g. 95% full frame border noise)
        if (origW < width * 0.98 || origH < height * 0.98) {
          rawBoxes.push({
            id: `detected_${boxCounter++}`,
            x: origX,
            y: origY,
            width: origW,
            height: origH,
            pixelCount: count * scale * scale,
          });
        }
      }
    }
  }

  // Merge nearby boxes (e.g., disjoint pieces of the same sprite)
  const mergedBoxes = mergeCloseBoxes(rawBoxes, mergeDistance);

  // Apply padding and clamp to image bounds
  const paddedBoxes: DetectedBox[] = mergedBoxes.map((b, i) => {
    const x = Math.max(0, b.x - padding);
    const y = Math.max(0, b.y - padding);
    const maxX = Math.min(width, b.x + b.width + padding);
    const maxY = Math.min(height, b.y + b.height + padding);

    return {
      id: `object_${i + 1}`,
      x,
      y,
      width: Math.max(1, maxX - x),
      height: Math.max(1, maxY - y),
      pixelCount: b.pixelCount,
    };
  });

  // Sort spatial reading order (top-to-bottom, left-to-right)
  return paddedBoxes.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < 15) {
      return a.x - b.x;
    }
    return yDiff;
  });
}

/**
 * Converts detected bounding boxes into CropRect format ready for the editor.
 */
export function convertDetectedBoxesToCrops(
  boxes: DetectedBox[],
  prefix = 'object',
  startNumber = 1
): CropRect[] {
  return boxes.map((box, idx) => ({
    id: `crop_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${prefix}_${String(startNumber + idx).padStart(2, '0')}`,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    selected: true,
  }));
}
