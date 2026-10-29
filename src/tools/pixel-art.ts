/**
 * Image to Pixel Art Tool (100% In-Browser)
 */
import {
  findNearestColor,
  applyBayerDither,
  PIXEL_PALETTES,
  type PixelPaletteName,
} from '../utils/pixelArtUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let baseImage: HTMLImageElement | null = null;
let originalFile: File | null = null;

let pixelSize = 12;
let selectedPalette: PixelPaletteName = 'gameboy';
let ditherMode: 'none' | 'bayer' = 'none';
let ditherIntensity = 28;
let showGrid = false;
let brightness = 0; // -50 to 50
let contrast = 0;   // -50 to 50

// DOM Elements
const dropzone = document.getElementById('pixel-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('pixel-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('pixel-workspace') as HTMLElement | null;
const canvas = document.getElementById('pixel-canvas') as HTMLCanvasElement | null;
const demoBtn = document.getElementById('pixel-demo-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('pixel-reset-btn') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('pixel-download-btn') as HTMLButtonElement | null;
const formatSelect = document.getElementById('pixel-format-select') as HTMLSelectElement | null;
const metaBadge = document.getElementById('pixel-image-meta') as HTMLElement | null;

// Controls
const pixelSizeSlider = document.getElementById('pixel-size-slider') as HTMLInputElement | null;
const pixelSizeVal = document.getElementById('pixel-size-val') as HTMLElement | null;
const paletteButtons = document.querySelectorAll<HTMLButtonElement>('[data-palette]');
const ditherSelect = document.getElementById('pixel-dither-select') as HTMLSelectElement | null;
const ditherIntensityContainer = document.getElementById('pixel-dither-container') as HTMLElement | null;
const ditherSlider = document.getElementById('pixel-dither-slider') as HTMLInputElement | null;
const ditherVal = document.getElementById('pixel-dither-val') as HTMLElement | null;
const gridCheck = document.getElementById('pixel-grid-check') as HTMLInputElement | null;
const brightnessSlider = document.getElementById('pixel-brightness') as HTMLInputElement | null;
const contrastSlider = document.getElementById('pixel-contrast') as HTMLInputElement | null;

export function initPixelArtTool(): void {
  if (!dropzone || !fileInput || !canvas) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadImage(file);
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  });

  demoBtn?.addEventListener('click', loadDemoPortrait);

  // Pixel Size
  pixelSizeSlider?.addEventListener('input', () => {
    pixelSize = Math.max(2, parseInt(pixelSizeSlider.value, 10) || 12);
    if (pixelSizeVal) pixelSizeVal.textContent = `${pixelSize}px`;
    render();
  });

  // Palette buttons
  paletteButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      paletteButtons.forEach((b) => b.classList.remove('border-blue-600', 'bg-blue-50', 'dark:bg-blue-950/50', 'text-blue-600', 'dark:text-blue-400'));
      btn.classList.add('border-blue-600', 'bg-blue-50', 'dark:bg-blue-950/50', 'text-blue-600', 'dark:text-blue-400');
      selectedPalette = (btn.getAttribute('data-palette') as PixelPaletteName) || 'gameboy';
      render();
    });
  });

  // Dithering
  ditherSelect?.addEventListener('change', () => {
    ditherMode = (ditherSelect.value as 'none' | 'bayer') || 'none';
    if (ditherMode === 'bayer') {
      ditherIntensityContainer?.classList.remove('hidden');
    } else {
      ditherIntensityContainer?.classList.add('hidden');
    }
    render();
  });

  ditherSlider?.addEventListener('input', () => {
    ditherIntensity = parseInt(ditherSlider.value, 10) || 28;
    if (ditherVal) ditherVal.textContent = String(ditherIntensity);
    render();
  });

  // Grid lines
  gridCheck?.addEventListener('change', () => {
    showGrid = gridCheck.checked;
    render();
  });

  // Brightness & Contrast
  brightnessSlider?.addEventListener('input', () => {
    brightness = parseInt(brightnessSlider.value, 10) || 0;
    render();
  });

  contrastSlider?.addEventListener('input', () => {
    contrast = parseInt(contrastSlider.value, 10) || 0;
    render();
  });

  resetBtn?.addEventListener('click', () => {
    baseImage = null;
    originalFile = null;
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);
}

function loadImage(file: File) {
  originalFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    baseImage = img;
    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    if (metaBadge) {
      metaBadge.textContent = `${img.naturalWidth} \u00D7 ${img.naturalHeight} px \u2022 ${formatBytes(file.size)}`;
    }

    render();
    showToast('Photo loaded! Converted to retro pixel art.', 'success');
  };
  img.src = url;
}

function loadDemoPortrait() {
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 600;
  demoCanvas.height = 600;
  const ctx = demoCanvas.getContext('2d');
  if (!ctx) return;

  // Colorful game character demo
  const grad = ctx.createRadialGradient(300, 300, 50, 300, 300, 300);
  grad.addColorStop(0, '#fde047');
  grad.addColorStop(0.5, '#f97316');
  grad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 600);

  // Smiley retro sphere
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(300, 280, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  // Eyes
  ctx.beginPath();
  ctx.arc(250, 260, 20, 0, Math.PI * 2);
  ctx.arc(350, 260, 20, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(300, 310, 50, 0, Math.PI);
  ctx.lineWidth = 12;
  ctx.stroke();

  demoCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'retro_demo.png', { type: 'image/png' });
      loadImage(file);
    }
  });
}

function render() {
  if (!canvas || !baseImage) return;

  const origW = baseImage.naturalWidth;
  const origH = baseImage.naturalHeight;

  // Downscaled low-resolution pixel dimensions
  const lowW = Math.max(1, Math.floor(origW / pixelSize));
  const lowH = Math.max(1, Math.floor(origH / pixelSize));

  // 1. Render downscaled image to offscreen canvas
  const lowCanvas = document.createElement('canvas');
  lowCanvas.width = lowW;
  lowCanvas.height = lowH;
  const lowCtx = lowCanvas.getContext('2d');
  if (!lowCtx) return;

  lowCtx.drawImage(baseImage, 0, 0, lowW, lowH);

  // 2. Process pixels (Brightness, Contrast, Quantization, Dithering)
  const imgData = lowCtx.getImageData(0, 0, lowW, lowH);
  const data = imgData.data;
  const palette = PIXEL_PALETTES[selectedPalette] || [];
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let y = 0; y < lowH; y++) {
    for (let x = 0; x < lowW; x++) {
      const idx = (y * lowW + x) * 4;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Brightness adjustment
      if (brightness !== 0) {
        r = Math.max(0, Math.min(255, r + brightness));
        g = Math.max(0, Math.min(255, g + brightness));
        b = Math.max(0, Math.min(255, b + brightness));
      }

      // Contrast adjustment
      if (contrast !== 0) {
        r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
      }

      // Dithering
      if (ditherMode === 'bayer') {
        const dithered = applyBayerDither(r, g, b, x, y, ditherIntensity);
        r = dithered.r;
        g = dithered.g;
        b = dithered.b;
      }

      // Palette Quantization
      if (selectedPalette !== 'original' && palette.length > 0) {
        const matched = findNearestColor(r, g, b, palette);
        r = matched.r;
        g = matched.g;
        b = matched.b;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }
  }

  lowCtx.putImageData(imgData, 0, 0);

  // 3. Upscale back to output canvas with NEAREST NEIGHBOR (crisp pixel blocks)
  canvas.width = lowW * pixelSize;
  canvas.height = lowH * pixelSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
  (ctx as any).webkitImageSmoothingEnabled = false;
  (ctx as any).msImageSmoothingEnabled = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(lowCanvas, 0, 0, canvas.width, canvas.height);

  // 4. Subtle Pixel Grid Overlay
  if (showGrid && pixelSize >= 4) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += pixelSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += pixelSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function handleDownload() {
  if (!canvas || !baseImage) return;

  const format = formatSelect?.value || 'image/png';
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';
  const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'pixel_art';

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_${selectedPalette}_pixelart.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Pixel art downloaded in crisp high-res!', 'success');
    },
    format,
    0.98
  );
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPixelArtTool);
} else {
  initPixelArtTool();
}
