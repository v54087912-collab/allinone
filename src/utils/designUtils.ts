/**
 * Design, Typography, Graphics, and Color Math Utilities
 */

import { hexToRgb, rgbToHsl, rgbToHex } from './colorPickerUtils.ts';

// Helper to convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rPrime = 0, gPrime = 0, bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else if (h >= 300 && h < 360) {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

/**
 * Generate 5-color harmonic palettes
 */
export function generateHarmonicPalette(
  baseHex: string,
  scheme: 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'monochromatic' | 'random' = 'analogous'
): string[] {
  const rgb = hexToRgb(baseHex) || { r: 59, g: 130, b: 246 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const { h, s, l } = hsl;

  const result: string[] = [];

  switch (scheme) {
    case 'complementary': {
      // Base, complementary, light, dark, muted
      result.push(baseHex);
      const compRgb = hslToRgb((h + 180) % 360, s, l);
      result.push(rgbToHex(compRgb.r, compRgb.g, compRgb.b));
      const light = hslToRgb(h, Math.max(10, s - 20), Math.min(92, l + 25));
      result.push(rgbToHex(light.r, light.g, light.b));
      const compLight = hslToRgb((h + 180) % 360, Math.max(10, s - 10), Math.min(88, l + 20));
      result.push(rgbToHex(compLight.r, compLight.g, compLight.b));
      const dark = hslToRgb(h, s, Math.max(15, l - 30));
      result.push(rgbToHex(dark.r, dark.g, dark.b));
      break;
    }
    case 'analogous': {
      // H - 30, H - 15, H, H + 15, H + 30
      const angles = [-30, -15, 0, 15, 30];
      angles.forEach((angle) => {
        const c = hslToRgb((h + angle + 360) % 360, s, l);
        result.push(rgbToHex(c.r, c.g, c.b));
      });
      break;
    }
    case 'triadic': {
      // H, H + 120, H + 240, plus accents
      result.push(baseHex);
      const c1 = hslToRgb((h + 120) % 360, s, l);
      result.push(rgbToHex(c1.r, c1.g, c1.b));
      const c2 = hslToRgb((h + 240) % 360, s, l);
      result.push(rgbToHex(c2.r, c2.g, c2.b));
      const c3 = hslToRgb((h + 60) % 360, Math.max(20, s - 20), Math.min(85, l + 15));
      result.push(rgbToHex(c3.r, c3.g, c3.b));
      const c4 = hslToRgb((h + 180) % 360, Math.max(20, s - 15), Math.max(20, l - 20));
      result.push(rgbToHex(c4.r, c4.g, c4.b));
      break;
    }
    case 'tetradic': {
      // H, H + 60, H + 180, H + 240, H + 300
      const angles = [0, 60, 180, 240, 300];
      angles.forEach((angle) => {
        const c = hslToRgb((h + angle) % 360, s, l);
        result.push(rgbToHex(c.r, c.g, c.b));
      });
      break;
    }
    case 'monochromatic': {
      // Vary lightness
      const lights = [Math.max(15, l - 35), Math.max(25, l - 15), l, Math.min(85, l + 15), Math.min(95, l + 30)];
      lights.forEach((lum) => {
        const c = hslToRgb(h, s, lum);
        result.push(rgbToHex(c.r, c.g, c.b));
      });
      break;
    }
    case 'random':
    default: {
      result.push(baseHex);
      for (let i = 1; i < 5; i++) {
        const randH = Math.floor(Math.random() * 360);
        const randS = 50 + Math.floor(Math.random() * 45);
        const randL = 35 + Math.floor(Math.random() * 45);
        const c = hslToRgb(randH, randS, randL);
        result.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
  }

  return result.slice(0, 5);
}

/**
 * WCAG 2.1 Relative Luminance formula
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * WCAG 2.1 Contrast Ratio calculation between two hex colors
 */
export function calculateContrastRatio(hex1: string, hex2: string): {
  ratio: number;
  ratioFormatted: string;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  score: 'Poor' | 'Fair' | 'Good' | 'Excellent';
} {
  const rgb1 = hexToRgb(hex1) || { r: 255, g: 255, b: 255 };
  const rgb2 = hexToRgb(hex2) || { r: 0, g: 0, b: 0 };

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const rawRatio = (lighter + 0.05) / (darker + 0.05);
  const ratio = Math.round(rawRatio * 100) / 100;

  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;

  let score: 'Poor' | 'Fair' | 'Good' | 'Excellent' = 'Poor';
  if (ratio >= 7.0) score = 'Excellent';
  else if (ratio >= 4.5) score = 'Good';
  else if (ratio >= 3.0) score = 'Fair';

  return {
    ratio,
    ratioFormatted: `${ratio.toFixed(2)}:1`,
    aaNormal,
    aaLarge,
    aaaNormal,
    aaaLarge,
    score,
  };
}

/**
 * CSS Box Shadow code generator
 */
export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

export function formatBoxShadowCss(layers: ShadowLayer[]): string {
  if (layers.length === 0) return 'none';
  return layers
    .map(
      (l) =>
        `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`
    )
    .join(', ');
}

/**
 * CSS 8-point Border Radius generator
 */
export function formatBorderRadiusCss(
  tl: number,
  tr: number,
  br: number,
  bl: number,
  tl2?: number,
  tr2?: number,
  br2?: number,
  bl2?: number
): string {
  if (tl2 !== undefined && tr2 !== undefined && br2 !== undefined && bl2 !== undefined) {
    return `${tl}% ${tr}% ${br}% ${bl}% / ${tl2}% ${tr2}% ${br2}% ${bl2}%`;
  }
  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

/**
 * Generates smooth SVG wave path
 */
export function generateSvgWave(
  width = 1440,
  height = 320,
  points = 4,
  curveHeight = 100,
  fill = '#3b82f6'
): { path: string; svgCode: string } {
  const step = width / (points - 1);
  const baseLine = height - curveHeight;

  let d = `M 0 ${baseLine} `;
  const coords: { x: number; y: number }[] = [];

  for (let i = 0; i < points; i++) {
    const x = i * step;
    const offset = Math.sin((i / (points - 1)) * Math.PI * 2) * (curveHeight / 2);
    const y = baseLine + offset;
    coords.push({ x, y });
  }

  for (let i = 0; i < coords.length - 1; i++) {
    const cpX = (coords[i].x + coords[i + 1].x) / 2;
    const cpY = (coords[i].y + coords[i + 1].y) / 2;
    d += `Q ${coords[i].x} ${coords[i].y}, ${cpX} ${cpY} `;
  }

  const last = coords[coords.length - 1];
  d += `T ${last.x} ${last.y} `;
  d += `L ${width} ${height} L 0 ${height} Z`;

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="${fill}">\n  <path d="${d.trim()}" />\n</svg>`;

  return { path: d.trim(), svgCode };
}

/**
 * Generates organic SVG Blob path
 */
export function generateSvgBlob(
  size = 400,
  numPoints = 6,
  randomness = 0.3,
  fill = '#6366f1'
): { path: string; svgCode: string } {
  const center = size / 2;
  const radius = center * 0.75;
  const angleStep = (Math.PI * 2) / numPoints;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep;
    const randomRadius = radius * (1 - randomness / 2 + Math.random() * randomness);
    const x = center + Math.cos(angle) * randomRadius;
    const y = center + Math.sin(angle) * randomRadius;
    points.push({ x, y });
  }

  // Close smoothly with bezier
  let d = `M ${points[0].x} ${points[0].y} `;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    d += `Q ${p0.x} ${p0.y}, ${midX} ${midY} `;
  }
  d += 'Z';

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="${fill}">\n  <path d="${d.trim()}" />\n</svg>`;

  return { path: d.trim(), svgCode };
}

/**
 * Social Media Image Sizing Presets
 */
export interface SocialPreset {
  platform: string;
  name: string;
  width: number;
  height: number;
  ratio: string;
}

export const SOCIAL_MEDIA_PRESETS: SocialPreset[] = [
  { platform: 'Instagram', name: 'Square Post (1:1)', width: 1080, height: 1080, ratio: '1:1' },
  { platform: 'Instagram', name: 'Portrait Post (4:5)', width: 1080, height: 1350, ratio: '4:5' },
  { platform: 'Instagram', name: 'Story / Reel (9:16)', width: 1080, height: 1920, ratio: '9:16' },
  { platform: 'YouTube', name: 'Thumbnail (16:9)', width: 1280, height: 720, ratio: '16:9' },
  { platform: 'YouTube', name: 'Channel Banner', width: 2560, height: 1440, ratio: '16:9' },
  { platform: 'X / Twitter', name: 'Post Image', width: 1200, height: 675, ratio: '16:9' },
  { platform: 'X / Twitter', name: 'Header Banner', width: 1500, height: 500, ratio: '3:1' },
  { platform: 'Facebook', name: 'Feed Post', width: 1200, height: 630, ratio: '1.91:1' },
  { platform: 'LinkedIn', name: 'Feed Image', width: 1200, height: 627, ratio: '1.91:1' },
  { platform: 'Pinterest', name: 'Pin Image (2:3)', width: 1000, height: 1500, ratio: '2:3' },
];

/**
 * ASCII Art Conversion from image pixel data
 */
export const ASCII_CHAR_SETS: Record<string, string> = {
  standard: '@%#*+=-:. ',
  dense: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  simple: '#@*+-. ',
  blocks: '█▓▒░ ',
  binary: '10 ',
};

export function convertPixelsToAscii(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  outputWidth = 80,
  charSet = ASCII_CHAR_SETS.standard,
  invert = false
): string {
  const aspectCorrection = 0.5; // ASCII characters are taller than wide
  const scale = width / outputWidth;
  const outputHeight = Math.max(1, Math.round((height / scale) * aspectCorrection));

  const chars = invert ? charSet.split('').reverse().join('') : charSet;
  const charLen = chars.length;

  const lines: string[] = [];

  for (let y = 0; y < outputHeight; y++) {
    let line = '';
    const srcY = Math.min(height - 1, Math.floor((y / aspectCorrection) * scale));

    for (let x = 0; x < outputWidth; x++) {
      const srcX = Math.min(width - 1, Math.floor(x * scale));
      const idx = (srcY * width + srcX) * 4;

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a < 50) {
        line += ' ';
        continue;
      }

      // Perceptual brightness
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const charIndex = Math.min(
        charLen - 1,
        Math.floor((1 - brightness) * charLen)
      );
      line += chars[charIndex];
    }
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Curated typography font pairings
 */
export interface FontPairing {
  id: string;
  heading: string;
  headingFont: string;
  body: string;
  bodyFont: string;
  tag: string;
  description: string;
}

export const CURATED_FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'editorial',
    heading: 'Playfair Display',
    headingFont: "'Playfair Display', serif",
    body: 'Source Sans 3',
    bodyFont: "'Source Sans 3', sans-serif",
    tag: 'Classic & Editorial',
    description: 'Timeless luxury and editorial elegance, perfect for magazines, portfolios, and fashion brands.',
  },
  {
    id: 'modern-tech',
    heading: 'Space Grotesk',
    headingFont: "'Space Grotesk', sans-serif",
    body: 'Inter',
    bodyFont: "'Inter', sans-serif",
    tag: 'Modern Tech & SaaS',
    description: 'Futuristic geometric headlines paired with crisp, ultra-readable UI body text.',
  },
  {
    id: 'creative-bold',
    heading: 'Syne',
    headingFont: "'Syne', sans-serif",
    body: 'Plus Jakarta Sans',
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    tag: 'Creative Agency',
    description: 'Bold, expressive design studio vibe paired with clean contemporary geometry.',
  },
  {
    id: 'humanist',
    heading: 'Fraunces',
    headingFont: "'Fraunces', serif",
    body: 'Outfit',
    bodyFont: "'Outfit', sans-serif",
    tag: 'Warm & Artisanal',
    description: 'Soft, organic retro curves balanced with clean minimalist sans-serif legibility.',
  },
  {
    id: 'minimalist',
    heading: 'Montserrat',
    headingFont: "'Montserrat', sans-serif",
    body: 'Lora',
    bodyFont: "'Lora', serif",
    tag: 'Minimal & Sophisticated',
    description: 'Crisp uppercase modernist geometric title paired with warm, literary serif prose.',
  },
];
