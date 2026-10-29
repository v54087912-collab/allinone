/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. SVG Optimizer
// ==========================================

export interface SvgOptimizeResult {
  optimizedSvg: string;
  originalBytes: number;
  optimizedBytes: number;
  savingsBytes: number;
  savingsPercent: number;
}

export function optimizeSvgString(svg: string): SvgOptimizeResult {
  const originalBytes = new TextEncoder().encode(svg).length;

  let cleaned = svg;

  // 1. Remove XML declaration & Doctype
  cleaned = cleaned.replace(/<\?xml[^>]*\?>/gi, '');
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');

  // 2. Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Remove metadata, sodipodi, inkscape, figma, sketch tags
  cleaned = cleaned.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  cleaned = cleaned.replace(/<sodipodi:[^>]*\/>/gi, '');
  cleaned = cleaned.replace(/<inkscape:[^>]*\/>/gi, '');

  // 4. Remove editor namespace attributes
  cleaned = cleaned.replace(/\sxmlns:inkscape="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\sxmlns:sodipodi="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\sinkscape:[a-z0-9_-]+="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\ssodipodi:[a-z0-9_-]+="[^"]*"/gi, '');

  // 5. Remove empty definitions and title/desc if empty
  cleaned = cleaned.replace(/<defs>\s*<\/defs>/gi, '');
  cleaned = cleaned.replace(/<title>\s*<\/title>/gi, '');
  cleaned = cleaned.replace(/<desc>\s*<\/desc>/gi, '');

  // 6. Round floating point numbers in paths to 2 decimals
  cleaned = cleaned.replace(/(\d+\.\d{3,})/g, match => Number(parseFloat(match).toFixed(2)).toString());

  // 7. Collapse excessive whitespace and linebreaks
  cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();

  const optimizedBytes = new TextEncoder().encode(cleaned).length;
  const savingsBytes = Math.max(0, originalBytes - optimizedBytes);
  const savingsPercent = originalBytes > 0 ? Number(((savingsBytes / originalBytes) * 100).toFixed(1)) : 0;

  return {
    optimizedSvg: cleaned,
    originalBytes,
    optimizedBytes,
    savingsBytes,
    savingsPercent
  };
}

// ==========================================
// 2. CSS Glassmorphism Generator
// ==========================================

export interface GlassmorphismOptions {
  blurPx: number;
  bgOpacity: number; // 0 to 1
  bgColorHex: string; // e.g. #ffffff or #0f172a
  borderOpacity: number;
  shadowIntensity: number; // 0 to 1
}

export function generateGlassmorphismStyles(options: GlassmorphismOptions): {
  css: string;
  tailwind: string;
} {
  const hex = options.bgColorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;

  const bgRgba = `rgba(${r}, ${g}, ${b}, ${options.bgOpacity.toFixed(2)})`;
  const borderRgba = `rgba(${r}, ${g}, ${b}, ${options.borderOpacity.toFixed(2)})`;
  const shadowAlpha = (0.2 * options.shadowIntensity).toFixed(2);

  const css = `background: ${bgRgba};
backdrop-filter: blur(${options.blurPx}px);
-webkit-backdrop-filter: blur(${options.blurPx}px);
border-radius: 16px;
border: 1px solid ${borderRgba};
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, ${shadowAlpha});`;

  const tailwind = `bg-white/[${options.bgOpacity.toFixed(2)}] backdrop-blur-[${options.blurPx}px] rounded-2xl border border-white/[${options.borderOpacity.toFixed(2)}] shadow-lg`;

  return { css, tailwind };
}

// ==========================================
// 3. SVG Placeholder Image Generator
// ==========================================

export function generatePlaceholderSvg(
  width: number,
  height: number,
  text?: string,
  bgColor: string = '#cbd5e1',
  textColor: string = '#475569'
): string {
  const label = text || `${width} × ${height}`;
  const fontSize = Math.max(14, Math.floor(Math.min(width, height) / 10));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}px" font-weight="600">${label}</text>
</svg>`;
}

// ==========================================
// 4. Bitmap to SVG Vectorization (Trace Quantized Pixel Runs)
// ==========================================

export function traceImageDataToSvg(
  imageData: ImageData,
  colorSimplification: number = 32 // Group RGB values
): string {
  const { width, height, data } = imageData;
  const colorMap = new Map<string, Array<{ x: number; y: number; w: number }>>();

  for (let y = 0; y < height; y++) {
    let currentRunColor = '';
    let runStartX = 0;
    let runLength = 0;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];

      if (a < 128) {
        // Transparent pixel finishes run
        if (runLength > 0 && currentRunColor) {
          if (!colorMap.has(currentRunColor)) colorMap.set(currentRunColor, []);
          colorMap.get(currentRunColor)!.push({ x: runStartX, y, w: runLength });
          runLength = 0;
        }
        currentRunColor = '';
        continue;
      }

      // Quantize RGB
      const r = Math.round(data[idx] / colorSimplification) * colorSimplification;
      const g = Math.round(data[idx + 1] / colorSimplification) * colorSimplification;
      const b = Math.round(data[idx + 2] / colorSimplification) * colorSimplification;
      const colorHex = `#${Math.min(255, r).toString(16).padStart(2, '0')}${Math.min(255, g).toString(16).padStart(2, '0')}${Math.min(255, b).toString(16).padStart(2, '0')}`;

      if (colorHex === currentRunColor) {
        runLength++;
      } else {
        if (runLength > 0 && currentRunColor) {
          if (!colorMap.has(currentRunColor)) colorMap.set(currentRunColor, []);
          colorMap.get(currentRunColor)!.push({ x: runStartX, y, w: runLength });
        }
        currentRunColor = colorHex;
        runStartX = x;
        runLength = 1;
      }
    }

    if (runLength > 0 && currentRunColor) {
      if (!colorMap.has(currentRunColor)) colorMap.set(currentRunColor, []);
      colorMap.get(currentRunColor)!.push({ x: runStartX, y, w: runLength });
    }
  }

  let pathsSvg = '';
  for (const [color, runs] of colorMap.entries()) {
    let d = '';
    for (const r of runs) {
      d += `M${r.x},${r.y}h${r.w}v1h-${r.w}z `;
    }
    pathsSvg += `<path fill="${color}" d="${d.trim()}"/>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${pathsSvg}</svg>`;
}
