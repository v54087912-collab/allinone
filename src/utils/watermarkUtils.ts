/**
 * Image Watermark Utility Functions
 * Supports:
 * - 9-grid position calculations
 * - Tiled pattern coordinates generation
 * - Font style formatting & RGBA color conversion
 */

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates absolute coordinates for a watermark placed in a 9-grid position.
 */
export function calculateWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  wmWidth: number,
  wmHeight: number,
  position: WatermarkPosition,
  padding = 24
): Point {
  let x = padding;
  let y = padding;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-center':
      x = (imageWidth - wmWidth) / 2;
      y = padding;
      break;
    case 'top-right':
      x = imageWidth - wmWidth - padding;
      y = padding;
      break;
    case 'center-left':
      x = padding;
      y = (imageHeight - wmHeight) / 2;
      break;
    case 'center':
      x = (imageWidth - wmWidth) / 2;
      y = (imageHeight - wmHeight) / 2;
      break;
    case 'center-right':
      x = imageWidth - wmWidth - padding;
      y = (imageHeight - wmHeight) / 2;
      break;
    case 'bottom-left':
      x = padding;
      y = imageHeight - wmHeight - padding;
      break;
    case 'bottom-center':
      x = (imageWidth - wmWidth) / 2;
      y = imageHeight - wmHeight - padding;
      break;
    case 'bottom-right':
      x = imageWidth - wmWidth - padding;
      y = imageHeight - wmHeight - padding;
      break;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

/**
 * Generates an array of grid points for tiled watermark coverage across an entire canvas.
 */
export function calculateTiledPositions(
  imageWidth: number,
  imageHeight: number,
  spacingX = 180,
  spacingY = 140
): Point[] {
  const points: Point[] = [];
  const sX = Math.max(50, spacingX);
  const sY = Math.max(50, spacingY);

  // Extend slightly beyond image boundaries to cover diagonal rotations smoothly
  const startX = -sX;
  const endX = imageWidth + sX * 2;
  const startY = -sY;
  const endY = imageHeight + sY * 2;

  let row = 0;
  for (let y = startY; y < endY; y += sY) {
    // Stagger every other row for an aesthetic brick/diagonal pattern
    const offsetX = (row % 2 === 1) ? sX / 2 : 0;
    for (let x = startX + offsetX; x < endX; x += sX) {
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
    row++;
  }

  return points;
}

/**
 * Converts a hex color string and opacity (0-1) to an rgba() CSS string.
 */
export function hexToRgba(hex: string, opacity = 1): string {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return `rgba(0, 0, 0, ${opacity})`;
  }

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const clampedOp = Math.max(0, Math.min(1, opacity));

  return `rgba(${r}, ${g}, ${b}, ${clampedOp})`;
}

/**
 * Builds a CSS font declaration string for canvas 2D rendering.
 */
export function buildCanvasFont(
  fontSize: number,
  fontFamily: string,
  isBold = false,
  isItalic = false
): string {
  const parts: string[] = [];
  if (isItalic) parts.push('italic');
  if (isBold) parts.push('bold');
  parts.push(`${Math.max(8, fontSize)}px`);
  parts.push(fontFamily || 'sans-serif');
  return parts.join(' ');
}
