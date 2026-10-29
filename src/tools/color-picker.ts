/**
 * Image Color Picker & Dominant Palette Extractor Tool (100% In-Browser)
 */
import {
  ColorDetails,
  extractDominantColorsFromPixels,
  getColorDetails,
  getContrastColor,
  rgbToHex,
} from '../utils/colorPickerUtils';
import { showToast } from '../shared/site-shell';

let loadedImage: HTMLImageElement | null = null;
let imageCanvas: HTMLCanvasElement | null = null;
let imageCtx: CanvasRenderingContext2D | null = null;
let savedColors: ColorDetails[] = [];
let currentColor: ColorDetails = getColorDetails(59, 130, 246);

export function initColorPickerTool(): void {
  const dropzone = document.getElementById('picker-dropzone');
  const fileInput = document.getElementById('picker-file-input') as HTMLInputElement;
  const demoBtn = document.getElementById('picker-demo-btn');
  const canvas = document.getElementById('picker-canvas') as HTMLCanvasElement;
  const loupeCanvas = document.getElementById('picker-loupe') as HTMLCanvasElement;
  const extractBtn = document.getElementById('picker-extract-btn');
  const clearSwatchesBtn = document.getElementById('picker-clear-swatches-btn');
  const exportCssBtn = document.getElementById('picker-export-css-btn');
  const exportJsonBtn = document.getElementById('picker-export-json-btn');

  if (!canvas || !fileInput) return;

  imageCanvas = canvas;
  imageCtx = canvas.getContext('2d', { willReadFrequently: true });

  // File loading
  dropzone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadImageFile(file);
    fileInput.value = '';
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50/20');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/20');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/20');
    const file = e.dataTransfer?.files?.[0];
    if (file) loadImageFile(file);
  });

  demoBtn?.addEventListener('click', () => loadDemoImage());

  // Canvas interaction
  canvas.addEventListener('mousemove', (e) => handleCanvasHover(e, loupeCanvas));
  canvas.addEventListener('mouseleave', () => {
    if (loupeCanvas) loupeCanvas.style.display = 'none';
  });

  canvas.addEventListener('click', (e) => handleCanvasClick(e));

  // Touch support for mobile devices
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      handleTouch(e.touches[0], loupeCanvas, true);
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      handleTouch(e.touches[0], loupeCanvas, false);
    }
  });

  // Extract dominant palette
  extractBtn?.addEventListener('click', () => extractDominantPalette());

  // Palette actions
  clearSwatchesBtn?.addEventListener('click', () => {
    savedColors = [];
    renderSwatches();
  });

  exportCssBtn?.addEventListener('click', () => exportPaletteAsCss());
  exportJsonBtn?.addEventListener('click', () => exportPaletteAsJson());

  // Copy buttons
  setupCopyButtons();
}

function loadImageFile(file: File): void {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    loadedImage = img;
    renderImageToCanvas();
    extractDominantPalette();
    showToast(`Loaded ${file.name}`, 'success');
  };
  img.src = url;
}

function loadDemoImage(): void {
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 600;
  demoCanvas.height = 400;
  const ctx = demoCanvas.getContext('2d')!;

  // Sunset gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 400);
  grad.addColorStop(0, '#f97316'); // orange
  grad.addColorStop(0.3, '#ec4899'); // pink
  grad.addColorStop(0.6, '#8b5cf6'); // purple
  grad.addColorStop(1, '#1e3a8a'); // dark blue
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 400);

  // Sun circle
  ctx.beginPath();
  ctx.arc(300, 180, 70, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.fill();

  // Mountain silhouettes
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(150, 240);
  ctx.lineTo(320, 360);
  ctx.lineTo(460, 260);
  ctx.lineTo(600, 400);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  demoCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'demo_sunset.png', { type: 'image/png' });
      loadImageFile(file);
    }
  }, 'image/png');
}

function renderImageToCanvas(): void {
  if (!loadedImage || !imageCanvas || !imageCtx) return;

  const emptyState = document.getElementById('picker-empty-state');
  const activeState = document.getElementById('picker-active-state');

  emptyState?.classList.add('hidden');
  activeState?.classList.remove('hidden');

  imageCanvas.width = loadedImage.width;
  imageCanvas.height = loadedImage.height;
  imageCtx.drawImage(loadedImage, 0, 0);

  // Sample center pixel by default
  samplePixelAt(Math.floor(loadedImage.width / 2), Math.floor(loadedImage.height / 2), true);
}

function getCanvasCoordinates(e: MouseEvent | Touch): { x: number; y: number } | null {
  if (!imageCanvas) return null;
  const rect = imageCanvas.getBoundingClientRect();
  const scaleX = imageCanvas.width / rect.width;
  const scaleY = imageCanvas.height / rect.height;

  const clientX = 'clientX' in e ? e.clientX : (e as Touch).clientX;
  const clientY = 'clientY' in e ? e.clientY : (e as Touch).clientY;

  const x = Math.floor((clientX - rect.left) * scaleX);
  const y = Math.floor((clientY - rect.top) * scaleY);

  if (x >= 0 && x < imageCanvas.width && y >= 0 && y < imageCanvas.height) {
    return { x, y };
  }
  return null;
}

function handleCanvasHover(e: MouseEvent, loupeCanvas: HTMLCanvasElement | null): void {
  const coords = getCanvasCoordinates(e);
  if (!coords) {
    if (loupeCanvas) loupeCanvas.style.display = 'none';
    return;
  }

  samplePixelAt(coords.x, coords.y, false);
  renderLoupe(coords.x, coords.y, e.clientX, e.clientY, loupeCanvas);
}

function handleCanvasClick(e: MouseEvent): void {
  const coords = getCanvasCoordinates(e);
  if (coords) {
    samplePixelAt(coords.x, coords.y, true);
    saveCurrentColor();
  }
}

function handleTouch(touch: Touch, loupeCanvas: HTMLCanvasElement | null, commit: boolean): void {
  const coords = getCanvasCoordinates(touch);
  if (coords) {
    samplePixelAt(coords.x, coords.y, commit);
    renderLoupe(coords.x, coords.y, touch.clientX, touch.clientY, loupeCanvas);
    if (commit) saveCurrentColor();
  }
}

function samplePixelAt(x: number, y: number, commit: boolean): void {
  if (!imageCtx) return;
  const pixel = imageCtx.getImageData(x, y, 1, 1).data;
  const details = getColorDetails(pixel[0], pixel[1], pixel[2], pixel[3] / 255);

  if (commit) {
    currentColor = details;
  }
  updateColorDisplay(details);
}

function renderLoupe(
  x: number,
  y: number,
  screenX: number,
  screenY: number,
  loupeCanvas: HTMLCanvasElement | null
): void {
  if (!loupeCanvas || !imageCtx) return;

  const loupeSize = 100;
  const zoom = 8;
  loupeCanvas.width = loupeSize;
  loupeCanvas.height = loupeSize;
  loupeCanvas.style.display = 'block';
  loupeCanvas.style.left = `${screenX + 15}px`;
  loupeCanvas.style.top = `${screenY - 115}px`;

  const lCtx = loupeCanvas.getContext('2d')!;
  lCtx.imageSmoothingEnabled = false;

  const sampleSize = Math.floor(loupeSize / zoom);
  const half = Math.floor(sampleSize / 2);
  const srcX = Math.max(0, x - half);
  const srcY = Math.max(0, y - half);

  // Draw magnified image
  lCtx.drawImage(imageCanvas!, srcX, srcY, sampleSize, sampleSize, 0, 0, loupeSize, loupeSize);

  // Center crosshair / target box
  const centerBoxSize = zoom;
  const centerPos = (loupeSize - centerBoxSize) / 2;
  lCtx.strokeStyle = '#ffffff';
  lCtx.lineWidth = 2;
  lCtx.strokeRect(centerPos, centerPos, centerBoxSize, centerBoxSize);
  lCtx.strokeStyle = '#000000';
  lCtx.lineWidth = 1;
  lCtx.strokeRect(centerPos, centerPos, centerBoxSize, centerBoxSize);
}

function updateColorDisplay(color: ColorDetails): void {
  const swatch = document.getElementById('picker-current-swatch');
  const hexVal = document.getElementById('picker-val-hex');
  const rgbVal = document.getElementById('picker-val-rgb');
  const hslVal = document.getElementById('picker-val-hsl');
  const cmykVal = document.getElementById('picker-val-cmyk');

  if (swatch) swatch.style.backgroundColor = color.hex;
  if (hexVal) hexVal.textContent = color.hex.toUpperCase();
  if (rgbVal) rgbVal.textContent = color.rgb;
  if (hslVal) hslVal.textContent = color.hsl;
  if (cmykVal) cmykVal.textContent = color.cmyk;
}

function saveCurrentColor(): void {
  if (savedColors.some((c) => c.hex === currentColor.hex)) return;
  savedColors.unshift(currentColor);
  if (savedColors.length > 20) savedColors.pop();
  renderSwatches();
}

function renderSwatches(): void {
  const list = document.getElementById('picker-swatches-list');
  const countBadge = document.getElementById('picker-swatches-count');
  if (countBadge) countBadge.textContent = `${savedColors.length}`;

  if (!list) return;
  list.innerHTML = '';

  if (savedColors.length === 0) {
    list.innerHTML = '<span class="text-xs text-slate-400">Click anywhere on the image to pin colors.</span>';
    return;
  }

  savedColors.forEach((color, idx) => {
    const item = document.createElement('div');
    item.className =
      'p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-2xs group cursor-pointer hover:border-blue-400';

    const contrast = getContrastColor(color.r, color.g, color.b);

    item.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 shadow-inner" style="background-color: ${color.hex}"></div>
        <span class="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 uppercase">${color.hex}</span>
      </div>
      <button type="button" data-copy-hex="${color.hex}" class="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors" title="Copy HEX">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
      </button>
    `;

    item.addEventListener('click', () => {
      currentColor = color;
      updateColorDisplay(color);
    });

    item.querySelector(`[data-copy-hex="${color.hex}"]`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(color.hex);
    });

    list.appendChild(item);
  });
}

function extractDominantPalette(): void {
  if (!imageCtx || !imageCanvas) return;
  const imgData = imageCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  const palette = extractDominantColorsFromPixels(imgData.data, 8);

  const container = document.getElementById('picker-palette-container');
  if (!container) return;
  container.innerHTML = '';

  palette.forEach((item) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className =
      'flex-1 min-w-[70px] h-20 rounded-xl p-2 flex flex-col justify-between text-left transition-transform hover:scale-105 shadow-sm cursor-pointer';
    swatch.style.backgroundColor = item.hex;

    const contrast = getContrastColor(item.rgb[0], item.rgb[1], item.rgb[2]);

    swatch.innerHTML = `
      <span class="text-[10px] font-bold font-mono" style="color: ${contrast}">${item.percentage}%</span>
      <span class="text-xs font-mono font-bold uppercase" style="color: ${contrast}">${item.hex}</span>
    `;

    swatch.addEventListener('click', () => {
      const details = getColorDetails(item.rgb[0], item.rgb[1], item.rgb[2]);
      currentColor = details;
      updateColorDisplay(details);
      saveCurrentColor();
      copyToClipboard(item.hex);
    });

    container.appendChild(swatch);
  });
}

function setupCopyButtons(): void {
  document.querySelectorAll('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      if (targetId) {
        const val = document.getElementById(targetId)?.textContent?.trim();
        if (val) copyToClipboard(val);
      }
    });
  });
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(
    () => showToast(`Copied ${text}`, 'success'),
    () => showToast('Failed to copy', 'error')
  );
}

function exportPaletteAsCss(): void {
  if (savedColors.length === 0) {
    showToast('No swatches to export', 'error');
    return;
  }
  let css = ':root {\n';
  savedColors.forEach((c, idx) => {
    css += `  --color-${idx + 1}: ${c.hex};\n`;
  });
  css += '}';
  copyToClipboard(css);
}

function exportPaletteAsJson(): void {
  if (savedColors.length === 0) {
    showToast('No swatches to export', 'error');
    return;
  }
  const json = JSON.stringify(
    savedColors.map((c) => ({
      hex: c.hex,
      rgb: c.rgb,
      hsl: c.hsl,
    })),
    null,
    2
  );
  copyToClipboard(json);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initColorPickerTool);
  } else {
    initColorPickerTool();
  }
}
