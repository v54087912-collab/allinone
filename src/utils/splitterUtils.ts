/**
 * Image Splitter Utility Functions
 * Supports:
 * - Row x Column uniform grid slicing (Instagram 9-grid, 3x1 carousels, NxM)
 * - Fixed tile size slicing (Game sprites, textures, map tiles)
 * - Slice coordinate calculation & clean filename generation
 */

export interface ImageSliceRect {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates slice rectangles for an image split into rows x cols.
 */
export function calculateGridSlices(
  imageWidth: number,
  imageHeight: number,
  rows: number,
  cols: number
): ImageSliceRect[] {
  const r = Math.max(1, Math.round(rows));
  const c = Math.max(1, Math.round(cols));

  const sliceW = Math.floor(imageWidth / c);
  const sliceH = Math.floor(imageHeight / r);

  const slices: ImageSliceRect[] = [];
  let idx = 0;

  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      const x = col * sliceW;
      const y = row * sliceH;

      // Adjust last column/row to capture remaining rounding pixels
      const w = col === c - 1 ? imageWidth - x : sliceW;
      const h = row === r - 1 ? imageHeight - y : sliceH;

      slices.push({
        index: idx++,
        row,
        col,
        x,
        y,
        width: Math.max(1, w),
        height: Math.max(1, h),
      });
    }
  }

  return slices;
}

/**
 * Calculates slice rectangles using fixed tile width and height.
 */
export function calculateFixedTileSlices(
  imageWidth: number,
  imageHeight: number,
  tileWidth: number,
  tileHeight: number
): ImageSliceRect[] {
  const tw = Math.max(8, Math.round(tileWidth));
  const th = Math.max(8, Math.round(tileHeight));

  const cols = Math.ceil(imageWidth / tw);
  const rows = Math.ceil(imageHeight / th);

  const slices: ImageSliceRect[] = [];
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tw;
      const y = r * th;
      const w = Math.min(tw, imageWidth - x);
      const h = Math.min(th, imageHeight - y);

      if (w > 0 && h > 0) {
        slices.push({
          index: idx++,
          row: r,
          col: c,
          x,
          y,
          width: w,
          height: h,
        });
      }
    }
  }

  return slices;
}

/**
 * Formats a clean, descriptive filename for an extracted image slice.
 */
export function generateSliceFilename(
  originalName: string,
  row: number,
  col: number,
  index: number,
  format: 'png' | 'jpg' | 'webp' = 'png'
): string {
  const base = originalName.replace(/\.[^/.]+$/, '').trim() || 'image';
  const pad = (n: number) => String(n + 1).padStart(2, '0');
  const ext = format === 'jpg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';

  return `${base}_part_${pad(index)}_r${row + 1}_c${col + 1}.${ext}`;
}
