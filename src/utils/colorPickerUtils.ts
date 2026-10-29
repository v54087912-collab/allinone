/**
 * Color picker & palette extraction utilities
 */

export interface ColorDetails {
  hex: string;
  rgb: string;
  hsl: string;
  cmyk: string;
  r: number;
  g: number;
  b: number;
  a: number;
}

export function componentToHex(c: number): string {
  const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  } else if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function getContrastColor(r: number, g: number, b: number): string {
  return getLuminance(r, g, b) > 140 ? '#000000' : '#ffffff';
}

export function getColorDetails(r: number, g: number, b: number, a: number = 1): ColorDetails {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const cmyk = rgbToCmyk(r, g, b);

  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    r,
    g,
    b,
    a,
  };
}

/**
 * Extracts top dominant colors from pixel buffer using bucket quantization
 */
export function extractDominantColorsFromPixels(
  pixels: Uint8ClampedArray,
  maxColors: number = 8
): Array<{ hex: string; rgb: [number, number, number]; percentage: number }> {
  const colorBuckets = new Map<string, { rSum: number; gSum: number; bSum: number; count: number }>();
  let totalSampled = 0;

  // Step sampling to keep it instantaneous even on 20MP photos
  const step = Math.max(1, Math.floor(pixels.length / (4 * 10000)));

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const a = pixels[i + 3];
    if (a < 50) continue; // Ignore transparent pixels

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Quantize to 5-bit color space (32 levels per channel)
    const qR = Math.round(r / 16) * 16;
    const qG = Math.round(g / 16) * 16;
    const qB = Math.round(b / 16) * 16;
    const key = `${qR},${qG},${qB}`;

    const existing = colorBuckets.get(key);
    if (existing) {
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
      existing.count++;
    } else {
      colorBuckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
    }
    totalSampled++;
  }

  if (totalSampled === 0) return [];

  // Sort buckets by frequency
  const sorted = Array.from(colorBuckets.values()).sort((a, b) => b.count - a.count);

  const results: Array<{ hex: string; rgb: [number, number, number]; percentage: number }> = [];

  for (const bucket of sorted) {
    const avgR = Math.round(bucket.rSum / bucket.count);
    const avgG = Math.round(bucket.gSum / bucket.count);
    const avgB = Math.round(bucket.bSum / bucket.count);

    // Ensure distinct colors (color distance check)
    const isTooClose = results.some((existing) => {
      const dr = existing.rgb[0] - avgR;
      const dg = existing.rgb[1] - avgG;
      const db = existing.rgb[2] - avgB;
      return Math.sqrt(dr * dr + dg * dg + db * db) < 32;
    });

    if (!isTooClose) {
      results.push({
        hex: rgbToHex(avgR, avgG, avgB),
        rgb: [avgR, avgG, avgB],
        percentage: Math.round((bucket.count / totalSampled) * 100),
      });
      if (results.length >= maxColors) break;
    }
  }

  return results;
}
