/**
 * Photo Collage Maker Utility Functions
 * Supports:
 * - Layout slot coordinate calculations for diverse multi-photo templates
 * - Aspect ratio dimensions
 * - Object-fit: cover coordinate calculations
 */

export type CollagePreset =
  | '2-side-by-side'
  | '2-stacked'
  | '3-top1-bottom2'
  | '3-left1-right2'
  | '4-grid'
  | '4-featured-left'
  | '6-grid'
  | '9-grid';

export interface CollageSlot {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export const COLLAGE_ASPECT_RATIOS: Record<string, CanvasDimensions> = {
  '1:1': { width: 1200, height: 1200 },
  '4:5': { width: 1080, height: 1350 },
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '4:3': { width: 1600, height: 1200 },
};

/**
 * Computes slot bounding boxes for a selected collage preset with custom spacing.
 */
export function calculateCollageSlots(
  canvasW: number,
  canvasH: number,
  preset: CollagePreset,
  spacing = 16
): CollageSlot[] {
  const gap = Math.max(0, spacing);
  const slots: CollageSlot[] = [];

  switch (preset) {
    case '2-side-by-side': {
      const w = (canvasW - gap * 3) / 2;
      const h = canvasH - gap * 2;
      slots.push({ index: 0, x: gap, y: gap, width: w, height: h });
      slots.push({ index: 1, x: gap * 2 + w, y: gap, width: w, height: h });
      break;
    }
    case '2-stacked': {
      const w = canvasW - gap * 2;
      const h = (canvasH - gap * 3) / 2;
      slots.push({ index: 0, x: gap, y: gap, width: w, height: h });
      slots.push({ index: 1, x: gap, y: gap * 2 + h, width: w, height: h });
      break;
    }
    case '3-top1-bottom2': {
      const topH = (canvasH - gap * 3) / 2;
      const botW = (canvasW - gap * 3) / 2;
      // Top single
      slots.push({ index: 0, x: gap, y: gap, width: canvasW - gap * 2, height: topH });
      // Bottom 2
      slots.push({ index: 1, x: gap, y: gap * 2 + topH, width: botW, height: topH });
      slots.push({ index: 2, x: gap * 2 + botW, y: gap * 2 + topH, width: botW, height: topH });
      break;
    }
    case '3-left1-right2': {
      const leftW = (canvasW - gap * 3) / 2;
      const rightH = (canvasH - gap * 3) / 2;
      // Left tall
      slots.push({ index: 0, x: gap, y: gap, width: leftW, height: canvasH - gap * 2 });
      // Right 2 stacked
      slots.push({ index: 1, x: gap * 2 + leftW, y: gap, width: leftW, height: rightH });
      slots.push({ index: 2, x: gap * 2 + leftW, y: gap * 2 + rightH, width: leftW, height: rightH });
      break;
    }
    case '4-grid': {
      const w = (canvasW - gap * 3) / 2;
      const h = (canvasH - gap * 3) / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          slots.push({
            index: r * 2 + c,
            x: gap + c * (w + gap),
            y: gap + r * (h + gap),
            width: w,
            height: h,
          });
        }
      }
      break;
    }
    case '4-featured-left': {
      const featuredW = (canvasW - gap * 3) * 0.6;
      const sideW = (canvasW - gap * 3) * 0.4;
      const sideH = (canvasH - gap * 4) / 3;
      // Featured left slot
      slots.push({ index: 0, x: gap, y: gap, width: featuredW, height: canvasH - gap * 2 });
      // 3 stacked on right
      for (let i = 0; i < 3; i++) {
        slots.push({
          index: i + 1,
          x: gap * 2 + featuredW,
          y: gap + i * (sideH + gap),
          width: sideW,
          height: sideH,
        });
      }
      break;
    }
    case '6-grid': {
      const cols = 3;
      const rows = 2;
      const w = (canvasW - gap * (cols + 1)) / cols;
      const h = (canvasH - gap * (rows + 1)) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          slots.push({
            index: r * cols + c,
            x: gap + c * (w + gap),
            y: gap + r * (h + gap),
            width: w,
            height: h,
          });
        }
      }
      break;
    }
    case '9-grid': {
      const cols = 3;
      const rows = 3;
      const w = (canvasW - gap * 4) / 3;
      const h = (canvasH - gap * 4) / 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          slots.push({
            index: r * 3 + c,
            x: gap + c * (w + gap),
            y: gap + r * (h + gap),
            width: w,
            height: h,
          });
        }
      }
      break;
    }
  }

  return slots.map((s) => ({
    index: s.index,
    x: Math.round(s.x),
    y: Math.round(s.y),
    width: Math.max(10, Math.round(s.width)),
    height: Math.max(10, Math.round(s.height)),
  }));
}

/**
 * Calculates source crop rectangle to draw an image inside a slot with `object-fit: cover`.
 */
export function calculateCoverCrop(
  imgW: number,
  imgH: number,
  slotW: number,
  slotH: number
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  const imgRatio = imgW / imgH;
  const slotRatio = slotW / slotH;

  let sWidth = imgW;
  let sHeight = imgH;
  let sx = 0;
  let sy = 0;

  if (imgRatio > slotRatio) {
    // Image is wider than slot: crop horizontally
    sWidth = imgH * slotRatio;
    sx = (imgW - sWidth) / 2;
  } else {
    // Image is taller than slot: crop vertically
    sHeight = imgW / slotRatio;
    sy = (imgH - sHeight) / 2;
  }

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sWidth: Math.round(sWidth),
    sHeight: Math.round(sHeight),
  };
}
