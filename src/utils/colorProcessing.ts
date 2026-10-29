/**
 * Purely client-side canvas pixel processing for background removal.
 * No AI or external services.
 */

export interface ColorRemovalOptions {
  tolerance: number; // 0 to 100
  mode: 'edge-flood' | 'all-white';
}

/**
 * Checks if a pixel at index is considered white based on Euclidean distance in RGB space.
 */
export function isNearWhite(
  r: number,
  g: number,
  b: number,
  tolerance: number
): boolean {
  // Max possible distance from (255, 255, 255) to (0, 0, 0) is sqrt(3 * 255^2) ≈ 441.67
  const dr = 255 - r;
  const dg = 255 - g;
  const db = 255 - b;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxDist = 441.67295593;
  const normalizedDist = (dist / maxDist) * 100;
  return normalizedDist <= tolerance;
}

/**
 * Processes an ImageData object to remove white background.
 * Modifies the provided ImageData in-place.
 */
export function applyWhiteRemoval(
  imageData: ImageData,
  options: ColorRemovalOptions
): ImageData {
  const { tolerance, mode } = options;
  const { width, height, data } = imageData;

  if (tolerance <= 0) return imageData;

  if (mode === 'all-white') {
    // Direct replacement for all matching pixels
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (isNearWhite(r, g, b, tolerance)) {
        data[i + 3] = 0; // Transparent
      }
    }
    return imageData;
  }

  // Edge-connected flood fill: only erase white contiguous with outer edges
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const getIdx = (x: number, y: number) => y * width + x;

  // Seed with all edge pixels
  for (let x = 0; x < width; x++) {
    // Top edge
    const topIdx = getIdx(x, 0);
    const topDataIdx = topIdx * 4;
    if (data[topDataIdx + 3] > 0 && isNearWhite(data[topDataIdx], data[topDataIdx + 1], data[topDataIdx + 2], tolerance)) {
      visited[topIdx] = 1;
      queue.push(x, 0);
    }

    // Bottom edge
    const btmIdx = getIdx(x, height - 1);
    const btmDataIdx = btmIdx * 4;
    if (data[btmDataIdx + 3] > 0 && isNearWhite(data[btmDataIdx], data[btmDataIdx + 1], data[btmDataIdx + 2], tolerance)) {
      visited[btmIdx] = 1;
      queue.push(x, height - 1);
    }
  }

  for (let y = 1; y < height - 1; y++) {
    // Left edge
    const leftIdx = getIdx(0, y);
    const leftDataIdx = leftIdx * 4;
    if (data[leftDataIdx + 3] > 0 && isNearWhite(data[leftDataIdx], data[leftDataIdx + 1], data[leftDataIdx + 2], tolerance)) {
      visited[leftIdx] = 1;
      queue.push(0, y);
    }

    // Right edge
    const rightIdx = getIdx(width - 1, y);
    const rightDataIdx = rightIdx * 4;
    if (data[rightDataIdx + 3] > 0 && isNearWhite(data[rightDataIdx], data[rightDataIdx + 1], data[rightDataIdx + 2], tolerance)) {
      visited[rightIdx] = 1;
      queue.push(width - 1, y);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const cIdx = getIdx(cx, cy);

    // Make transparent
    data[cIdx * 4 + 3] = 0;

    // Check 4-connected neighbors
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (let i = 0; i < neighbors.length; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = getIdx(nx, ny);
        if (!visited[nIdx]) {
          const nDataIdx = nIdx * 4;
          if (data[nDataIdx + 3] > 0 && isNearWhite(data[nDataIdx], data[nDataIdx + 1], data[nDataIdx + 2], tolerance)) {
            visited[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  return imageData;
}
