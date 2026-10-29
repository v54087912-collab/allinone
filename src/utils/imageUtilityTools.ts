/**
 * Core image, color, SVG, and photo utility functions
 * 100% Client-Side & Pure Unit-Testable Math
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface AverageColorResult {
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  luminance: number;
  isDark: boolean;
}

/**
 * Converts R, G, B channels (0-255) to uppercase 6-character HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Parses HEX color into RGB channels
 */
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Converts RGB (0-255) to HSL (H: 0-360, S: 0-100, L: 0-100)
 */
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case nr:
        h = (ng - nb) / d + (ng < nb ? 6 : 0);
        break;
      case ng:
        h = (nb - nr) / d + 2;
        break;
      case nb:
        h = (nr - ng) / d + 4;
        break;
    }
    h = h / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL (H: 0-360, S: 0-100, L: 0-100) to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RgbColor {
  const normH = ((h % 360) + 360) % 360 / 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;

  if (normS === 0) {
    const val = Math.round(normL * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let nt = t;
    if (nt < 0) nt += 1;
    if (nt > 1) nt -= 1;
    if (nt < 1 / 6) return p + (q - p) * 6 * nt;
    if (nt < 1 / 2) return q;
    if (nt < 2 / 3) return p + (q - p) * (2 / 3 - nt) * 6;
    return p;
  };

  const q = normL < 0.5 ? normL * (1 + normS) : normL + normS - normL * normS;
  const p = 2 * normL - q;

  return {
    r: Math.round(hue2rgb(p, q, normH + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, normH) * 255),
    b: Math.round(hue2rgb(p, q, normH - 1 / 3) * 255)
  };
}

/**
 * Calculates average/mean color across raw RGBA byte buffer
 */
export function calculateAverageColorFromData(data: Uint8ClampedArray | number[]): AverageColorResult {
  if (!data || data.length < 4) {
    return {
      hex: '#000000',
      rgb: { r: 0, g: 0, b: 0 },
      hsl: { h: 0, s: 0, l: 0 },
      luminance: 0,
      isDark: true
    };
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  // Sample every step pixels to maintain instant client-side performance
  const step = Math.max(1, Math.floor(data.length / (4 * 50000))) * 4;

  for (let i = 0; i < data.length; i += step) {
    const alpha = data[i + 3];
    if (alpha > 30) {
      // Ignore transparent pixels
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      count++;
    }
  }

  if (count === 0) {
    return {
      hex: '#FFFFFF',
      rgb: { r: 255, g: 255, b: 255 },
      hsl: { h: 0, s: 0, l: 100 },
      luminance: 1,
      isDark: false
    };
  }

  const r = Math.round(totalR / count);
  const g = Math.round(totalG / count);
  const b = Math.round(totalB / count);

  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);

  // Perceived relative luminance (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isDark = luminance < 0.5;

  return { hex, rgb: { r, g, b }, hsl, luminance, isDark };
}

/**
 * Derives complementary, analogous, and triadic color harmonies from hex
 */
export function calculateColorHarmonies(hex: string): {
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
  shades: string[];
} {
  const rgb = hexToRgb(hex) || { r: 128, g: 128, b: 128 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const compRgb = hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
  const complementary = rgbToHex(compRgb.r, compRgb.g, compRgb.b);

  const ana1Rgb = hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l);
  const ana2Rgb = hslToRgb((hsl.h + 330) % 360, hsl.s, hsl.l);
  const analogous: [string, string] = [
    rgbToHex(ana1Rgb.r, ana1Rgb.g, ana1Rgb.b),
    rgbToHex(ana2Rgb.r, ana2Rgb.g, ana2Rgb.b)
  ];

  const tri1Rgb = hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l);
  const tri2Rgb = hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l);
  const triadic: [string, string] = [
    rgbToHex(tri1Rgb.r, tri1Rgb.g, tri1Rgb.b),
    rgbToHex(tri2Rgb.r, tri2Rgb.g, tri2Rgb.b)
  ];

  const shades = [0.2, 0.4, 0.6, 0.8].map((lightFactor) => {
    const sRgb = hslToRgb(hsl.h, hsl.s, Math.round(lightFactor * 100));
    return rgbToHex(sRgb.r, sRgb.g, sRgb.b);
  });

  return { complementary, analogous, triadic, shades };
}

/**
 * Generates smooth closed SVG cubic Bézier blob path
 */
export function generateSvgBlobPath(
  pointsCount: number,
  randomness: number,
  size: number = 400,
  seed: number = 42
): string {
  const count = Math.max(3, Math.min(16, Math.round(pointsCount)));
  const randFactor = Math.max(0, Math.min(1, randomness));
  const center = size / 2;
  const baseRadius = (size / 2) * 0.72;

  // Simple pseudo-random generator with seed
  let currentSeed = seed;
  const pseudoRand = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const angleStep = (Math.PI * 2) / count;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const offset = (pseudoRand() - 0.5) * 2 * randFactor * (baseRadius * 0.55);
    const r = baseRadius + offset;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    points.push({ x, y });
  }

  // Build smooth closed cubic spline
  const pLen = points.length;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < pLen; i++) {
    const p0 = points[(i - 1 + pLen) % pLen];
    const p1 = points[i];
    const p2 = points[(i + 1) % pLen];
    const p3 = points[(i + 2) % pLen];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  d += ' Z';
  return d;
}

/**
 * Generates seamless repeating SVG background pattern
 */
export function generateSvgPattern(
  type: string,
  tileSize: number = 40,
  elementSize: number = 8,
  strokeWidth: number = 2,
  fgColor: string = '#3b82f6',
  bgColor: string = '#ffffff',
  opacity: number = 1
): { svg: string; dataUri: string; css: string } {
  const ts = Math.max(8, Math.min(200, Math.round(tileSize)));
  const es = Math.max(1, Math.min(ts, Math.round(elementSize)));
  const sw = Math.max(1, Math.min(20, Math.round(strokeWidth)));
  const op = Math.max(0.05, Math.min(1, opacity));

  let innerPattern = '';

  switch (type) {
    case 'dots':
    case 'polka': {
      const r = es / 2;
      innerPattern = `<circle cx="${ts / 2}" cy="${ts / 2}" r="${r}" fill="${fgColor}" opacity="${op}" />`;
      break;
    }
    case 'grid': {
      innerPattern = `
        <path d="M ${ts} 0 L 0 0 0 ${ts}" fill="none" stroke="${fgColor}" stroke-width="${sw}" opacity="${op}" />
      `;
      break;
    }
    case 'isometric': {
      const half = ts / 2;
      innerPattern = `
        <path d="M 0 ${half} L ${half} 0 L ${ts} ${half} L ${half} ${ts} Z" fill="none" stroke="${fgColor}" stroke-width="${sw}" opacity="${op}" />
      `;
      break;
    }
    case 'stripes':
    case 'diagonal': {
      innerPattern = `
        <line x1="0" y1="0" x2="${ts}" y2="${ts}" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="square" opacity="${op}" />
        <line x1="${-ts}" y1="0" x2="0" y2="${ts}" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="square" opacity="${op}" />
        <line x1="0" y1="${-ts}" x2="${ts}" y2="0" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="square" opacity="${op}" />
      `;
      break;
    }
    case 'crosses': {
      const half = ts / 2;
      const leg = es / 2;
      innerPattern = `
        <line x1="${half - leg}" y1="${half}" x2="${half + leg}" y2="${half}" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}" />
        <line x1="${half}" y1="${half - leg}" x2="${half}" y2="${half + leg}" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}" />
      `;
      break;
    }
    case 'chevron': {
      const half = ts / 2;
      innerPattern = `
        <path d="M 0 ${half} L ${half} 0 L ${ts} ${half}" fill="none" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}" />
        <path d="M 0 ${ts + half} L ${half} ${ts} L ${ts} ${ts + half}" fill="none" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}" />
      `;
      break;
    }
    case 'waves': {
      const h = ts / 2;
      innerPattern = `
        <path d="M 0 ${h} Q ${ts / 4} ${h - es} ${ts / 2} ${h} T ${ts} ${h}" fill="none" stroke="${fgColor}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}" />
      `;
      break;
    }
    case 'circles': {
      innerPattern = `
        <circle cx="${ts / 2}" cy="${ts / 2}" r="${es / 2}" fill="none" stroke="${fgColor}" stroke-width="${sw}" opacity="${op}" />
      `;
      break;
    }
    default: {
      innerPattern = `<circle cx="${ts / 2}" cy="${ts / 2}" r="${es / 2}" fill="${fgColor}" opacity="${op}" />`;
    }
  }

  const bgRect = bgColor === 'transparent' ? '' : `<rect width="${ts}" height="${ts}" fill="${bgColor}" />`;
  const patternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ts}" height="${ts}" viewBox="0 0 ${ts} ${ts}">${bgRect}${innerPattern.trim()}</svg>`;

  const encodedSvg = encodeURIComponent(patternSvg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  const css = `background-color: ${bgColor};\nbackground-image: url("${dataUri}");`;

  return { svg: patternSvg, dataUri, css };
}

/**
 * Formats a Date object into classic camera date stamp strings
 */
export function formatPhotoDateStamp(date: Date, format: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fullYear = date.getFullYear();
  const shortYear = `'${pad(fullYear % 100)}`;
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  switch (format) {
    case 'short-y-m-d': // '98 10 28
      return `${shortYear} ${month} ${day}`;
    case 'short-y-m-d-time': // '98 10 28 14:30
      return `${shortYear} ${month} ${day} ${hours}:${minutes}`;
    case 'yyyy-mm-dd': // 1998-10-28
      return `${fullYear}-${month}-${day}`;
    case 'dd.mm.yyyy': // 28.10.1998
      return `${day}.${month}.${fullYear}`;
    case 'mm/dd/yyyy': // 10/28/1998
      return `${month}/${day}/${fullYear}`;
    case 'y2k': // '01 12 31
      return `'01 12 31`;
    default:
      return `${shortYear} ${month} ${day}`;
  }
}

/**
 * Calculates aspect-ratio source & destination rectangles for resizing/cropping
 */
export function calculateAspectRatioFit(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  mode: 'fit' | 'cover' | 'stretch'
): {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
} {
  if (mode === 'stretch') {
    return {
      sx: 0,
      sy: 0,
      sw: srcW,
      sh: srcH,
      dx: 0,
      dy: 0,
      dw: targetW,
      dh: targetH
    };
  }

  if (mode === 'cover') {
    // Center crop source to match target aspect ratio
    const srcRatio = srcW / srcH;
    const targetRatio = targetW / targetH;
    let sw = srcW;
    let sh = srcH;
    let sx = 0;
    let sy = 0;

    if (srcRatio > targetRatio) {
      sw = srcH * targetRatio;
      sx = (srcW - sw) / 2;
    } else {
      sh = srcW / targetRatio;
      sy = (srcH - sh) / 2;
    }

    return {
      sx,
      sy,
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: targetW,
      dh: targetH
    };
  }

  // mode === 'fit': scale down proportionally within target bounding box
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const dw = Math.round(srcW * scale);
  const dh = Math.round(srcH * scale);
  const dx = Math.round((targetW - dw) / 2);
  const dy = Math.round((targetH - dh) / 2);

  return {
    sx: 0,
    sy: 0,
    sw: srcW,
    sh: srcH,
    dx,
    dy,
    dw,
    dh
  };
}

/**
 * Clamps crop rectangle strictly inside image boundaries
 */
export function clampCropBox(
  crop: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number,
  minSize: number = 20
): { x: number; y: number; w: number; h: number } {
  const w = Math.max(minSize, Math.min(imgW, crop.w));
  const h = Math.max(minSize, Math.min(imgH, crop.h));
  const x = Math.max(0, Math.min(imgW - w, crop.x));
  const y = Math.max(0, Math.min(imgH - h, crop.y));
  return { x, y, w, h };
}

/**
 * Formats image Base64 data URI into embeddable code snippets
 */
export function formatBase64Snippets(
  dataUri: string,
  mime: string = 'image/png',
  rawBytes?: number
): {
  dataUri: string;
  imgTag: string;
  cssBg: string;
  rawBase64: string;
  base64Chars: number;
  base64Bytes: number;
  originalBytes: number;
  overheadPercent: number;
} {
  const parts = dataUri.split(',');
  const rawBase64 = parts.length > 1 ? parts[1] : dataUri;
  const chars = rawBase64.length;
  // Base64 byte length is chars * 1 byte (or 2 for UTF-16 in memory)
  const base64Bytes = chars;
  const originalBytes = rawBytes || Math.round((chars * 3) / 4);
  const overhead = originalBytes > 0 ? Math.round(((base64Bytes - originalBytes) / originalBytes) * 100) : 33;

  return {
    dataUri,
    imgTag: `<img src="${dataUri}" alt="Converted Image" />`,
    cssBg: `background-image: url("${dataUri}");`,
    rawBase64,
    base64Chars: chars,
    base64Bytes,
    originalBytes,
    overheadPercent: Math.max(0, overhead)
  };
}

/**
 * Wraps text into lines based on maximum character count
 */
export function wrapCaptionLines(text: string, maxCharsPerLine: number = 32): string[] {
  if (!text || !text.trim()) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Converts stroke attributes on SVG shapes to filled equivalents
 */
export function convertSvgStrokesToFills(
  svgString: string,
  options?: { customFill?: string }
): { convertedSvg: string; strokeCount: number } {
  let count = 0;
  const customFill = options?.customFill;

  // Replace stroke="..." with fill="..."
  let result = svgString.replace(
    /(<[a-zA-Z0-9]+[^>]*?)stroke=["']([^"']+)["']([^>]*?>)/gi,
    (match, prefix, strokeColor, suffix) => {
      if (strokeColor === 'none' || strokeColor === 'transparent') {
        return match;
      }
      count++;
      const fillColor = customFill || strokeColor;

      // Check if fill is already present in prefix or suffix
      let newTag = prefix + suffix;
      if (/fill=["'][^"']*["']/i.test(newTag)) {
        newTag = newTag.replace(/fill=["'][^"']*["']/i, `fill="${fillColor}"`);
      } else {
        newTag = `${prefix}fill="${fillColor}"${suffix}`;
      }

      // Remove stroke-width and stroke attributes if present
      newTag = newTag.replace(/stroke-width=["'][^"']*["']/gi, '');
      newTag = newTag.replace(/stroke=["'][^"']*["']/gi, '');
      return newTag;
    }
  );

  return { convertedSvg: result, strokeCount: count };
}
