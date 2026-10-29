/**
 * Image to Pixel Art Utility Functions
 * Supports:
 * - Color quantization to retro gaming palettes (Game Boy, NES, PICO-8, CGA, Cyberpunk)
 * - Bayer matrix ordered dithering
 * - Euclidean RGB distance color matching
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type PixelPaletteName =
  | 'original'
  | 'gameboy'
  | 'pico8'
  | 'nes'
  | 'cga'
  | 'cyberpunk'
  | 'grayscale'
  | 'monochrome';

export const PIXEL_PALETTES: Record<PixelPaletteName, RGB[]> = {
  original: [], // Handled dynamically
  gameboy: [
    { r: 15, g: 56, b: 15 },
    { r: 48, g: 98, b: 48 },
    { r: 139, g: 172, b: 15 },
    { r: 155, g: 188, b: 15 },
  ],
  pico8: [
    { r: 0, g: 0, b: 0 },
    { r: 29, g: 43, b: 83 },
    { r: 126, g: 37, b: 83 },
    { r: 0, g: 135, b: 81 },
    { r: 171, g: 82, b: 54 },
    { r: 95, g: 87, b: 79 },
    { r: 194, g: 195, b: 199 },
    { r: 255, g: 241, b: 232 },
    { r: 255, g: 0, b: 77 },
    { r: 255, g: 163, b: 0 },
    { r: 255, g: 236, b: 39 },
    { r: 0, g: 228, b: 54 },
    { r: 41, g: 173, b: 255 },
    { r: 131, g: 118, b: 156 },
    { r: 255, g: 119, b: 168 },
    { r: 255, g: 204, b: 170 },
  ],
  nes: [
    { r: 0, g: 0, b: 0 },
    { r: 252, g: 252, b: 252 },
    { r: 248, g: 56, b: 0 },
    { r: 228, g: 92, b: 16 },
    { r: 172, g: 124, b: 0 },
    { r: 0, g: 168, b: 0 },
    { r: 0, g: 148, b: 0 },
    { r: 0, g: 136, b: 136 },
    { r: 0, g: 120, b: 248 },
    { r: 60, g: 188, b: 252 },
    { r: 152, g: 120, b: 248 },
    { r: 248, g: 120, b: 248 },
    { r: 248, g: 88, b: 152 },
    { r: 104, g: 68, b: 252 },
    { r: 0, g: 232, b: 216 },
    { r: 184, g: 248, b: 184 },
  ],
  cga: [
    { r: 0, g: 0, b: 0 },
    { r: 0, g: 170, b: 170 },
    { r: 170, g: 0, b: 170 },
    { r: 255, g: 255, b: 255 },
  ],
  cyberpunk: [
    { r: 13, g: 2, b: 33 },
    { r: 255, g: 0, b: 110 },
    { r: 131, g: 56, b: 236 },
    { r: 58, g: 134, b: 255 },
    { r: 0, g: 245, b: 212 },
    { r: 254, g: 228, b: 64 },
  ],
  grayscale: [
    { r: 20, g: 20, b: 20 },
    { r: 90, g: 90, b: 90 },
    { r: 170, g: 170, b: 170 },
    { r: 245, g: 245, b: 245 },
  ],
  monochrome: [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ],
};

// 4x4 Bayer Dithering Matrix
export const BAYER_MATRIX_4X4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Finds the closest matching RGB color in a palette using weighted Euclidean distance.
 */
export function findNearestColor(r: number, g: number, b: number, palette: RGB[]): RGB {
  if (palette.length === 0) return { r, g, b };

  let minDistance = Infinity;
  let nearest = palette[0];

  for (let i = 0; i < palette.length; i++) {
    const p = palette[i];
    // Human perception weights: red 0.3, green 0.59, blue 0.11
    const dr = r - p.r;
    const dg = g - p.g;
    const db = b - p.b;
    const distance = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;

    if (distance < minDistance) {
      minDistance = distance;
      nearest = p;
    }
  }

  return nearest;
}

/**
 * Applies Bayer ordered dithering threshold to RGB components.
 */
export function applyBayerDither(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number,
  intensity = 32
): RGB {
  const threshold = (BAYER_MATRIX_4X4[y % 4][x % 4] / 16 - 0.5) * intensity;
  return {
    r: Math.max(0, Math.min(255, Math.round(r + threshold))),
    g: Math.max(0, Math.min(255, Math.round(g + threshold))),
    b: Math.max(0, Math.min(255, Math.round(b + threshold))),
  };
}
