/**
 * Image Watermark Tool (100% In-Browser)
 */
import {
  calculateWatermarkPosition,
  calculateTiledPositions,
  hexToRgba,
  buildCanvasFont,
  type WatermarkPosition,
} from '../utils/watermarkUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let baseImage: HTMLImageElement | null = null;
let logoImage: HTMLImageElement | null = null;
let originalFile: File | null = null;

// Settings
let watermarkType: 'text' | 'image' = 'text';
let watermarkText = '© Toolora';
let fontSize = 36;
let fontFamily = 'Inter';
let textColor = '#ffffff';
let textOpacity = 0.8;
let rotationDeg = -30;
let positionMode: 'grid' | 'tile' | 'custom' = 'grid';
let gridPosition: WatermarkPosition = 'bottom-right';
let customPos: { x: number; y: number } | null = null;
let logoScale = 0.25; // 25% of image width

// DOM Elements
const dropzone = document.getElementById('wm-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('wm-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('wm-workspace') as HTMLElement | null;
const canvas = document.getElementById('wm-canvas') as HTMLCanvasElement | null;
const demoBtn = document.getElementById('wm-demo-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('wm-reset-btn') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('wm-download-btn') as HTMLButtonElement | null;
const formatSelect = document.getElementById('wm-format-select') as HTMLSelectElement | null;
const imageMetaBadge = document.getElementById('wm-image-meta') as HTMLElement | null;

// Watermark Settings Inputs
const wmTypeRadios = document.querySelectorAll<HTMLInputElement>('input[name="wm-type"]');
const textControls = document.getElementById('wm-text-controls') as HTMLElement | null;
const imageControls = document.getElementById('wm-image-controls') as HTMLElement | null;
const textInput = document.getElementById('wm-text-input') as HTMLInputElement | null;
const fontSizeSlider = document.getElementById('wm-font-size') as HTMLInputElement | null;
const fontSizeVal = document.getElementById('wm-font-size-val') as HTMLElement | null;
const fontSelect = document.getElementById('wm-font-family') as HTMLSelectElement | null;
const colorPicker = document.getElementById('wm-color-picker') as HTMLInputElement | null;
const opacitySlider = document.getElementById('wm-opacity') as HTMLInputElement | null;
const opacityVal = document.getElementById('wm-opacity-val') as HTMLElement | null;
const rotationSlider = document.getElementById('wm-rotation') as HTMLInputElement | null;
const rotationVal = document.getElementById('wm-rotation-val') as HTMLElement | null;
const logoInput = document.getElementById('wm-logo-input') as HTMLInputElement | null;
const logoScaleSlider = document.getElementById('wm-logo-scale') as HTMLInputElement | null;
const logoScaleVal = document.getElementById('wm-logo-scale-val') as HTMLElement | null;

// Placement Inputs
const posModeRadios = document.querySelectorAll<HTMLInputElement>('input[name="wm-pos-mode"]');
const gridButtons = document.querySelectorAll<HTMLButtonElement>('[data-pos]');

export function initWatermarkTool(): void {
  if (!dropzone || !fileInput || !canvas) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadBaseImage(file);
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
    if (file && file.type.startsWith('image/')) loadBaseImage(file);
  });

  demoBtn?.addEventListener('click', loadDemoPhoto);

  // Type toggle (Text vs Image)
  wmTypeRadios.forEach((r) => {
    r.addEventListener('change', () => {
      watermarkType = (r.value as 'text' | 'image') || 'text';
      if (watermarkType === 'text') {
        textControls?.classList.remove('hidden');
        imageControls?.classList.add('hidden');
      } else {
        textControls?.classList.add('hidden');
        imageControls?.classList.remove('hidden');
      }
      render();
    });
  });

  // Text inputs
  textInput?.addEventListener('input', () => {
    watermarkText = textInput.value || '';
    render();
  });

  fontSizeSlider?.addEventListener('input', () => {
    fontSize = parseInt(fontSizeSlider.value, 10) || 36;
    if (fontSizeVal) fontSizeVal.textContent = `${fontSize}px`;
    render();
  });

  fontSelect?.addEventListener('change', () => {
    fontFamily = fontSelect.value || 'Inter';
    render();
  });

  colorPicker?.addEventListener('input', () => {
    textColor = colorPicker.value || '#ffffff';
    render();
  });

  opacitySlider?.addEventListener('input', () => {
    textOpacity = (parseInt(opacitySlider.value, 10) || 80) / 100;
    if (opacityVal) opacityVal.textContent = `${Math.round(textOpacity * 100)}%`;
    render();
  });

  rotationSlider?.addEventListener('input', () => {
    rotationDeg = parseInt(rotationSlider.value, 10) || 0;
    if (rotationVal) rotationVal.textContent = `${rotationDeg}\u00B0`;
    render();
  });

  // Logo input
  logoInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        logoImage = img;
        render();
        showToast('Logo watermark loaded!', 'success');
      };
      img.src = url;
    }
  });

  logoScaleSlider?.addEventListener('input', () => {
    logoScale = (parseInt(logoScaleSlider.value, 10) || 25) / 100;
    if (logoScaleVal) logoScaleVal.textContent = `${Math.round(logoScale * 100)}%`;
    render();
  });

  // Position Mode
  posModeRadios.forEach((r) => {
    r.addEventListener('change', () => {
      positionMode = (r.value as any) || 'grid';
      const gridPicker = document.getElementById('wm-grid-picker');
      if (positionMode === 'grid') {
        gridPicker?.classList.remove('opacity-40', 'pointer-events-none');
      } else {
        gridPicker?.classList.add('opacity-40', 'pointer-events-none');
      }
      render();
    });
  });

  // 9-Grid Buttons
  gridButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      gridButtons.forEach((b) => b.classList.remove('bg-blue-600', 'text-white'));
      btn.classList.add('bg-blue-600', 'text-white');
      gridPosition = (btn.getAttribute('data-pos') as WatermarkPosition) || 'bottom-right';
      customPos = null;
      render();
    });
  });

  // Canvas Click for Custom Placement
  canvas.addEventListener('click', (e) => {
    if (positionMode === 'tile' || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    customPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    render();
  });

  resetBtn?.addEventListener('click', () => {
    baseImage = null;
    originalFile = null;
    logoImage = null;
    customPos = null;
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);
}

function loadBaseImage(file: File) {
  originalFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    baseImage = img;
    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    // Auto-scale default font size relative to image resolution
    fontSize = Math.max(20, Math.round(img.naturalWidth / 24));
    if (fontSizeSlider) fontSizeSlider.value = String(fontSize);
    if (fontSizeVal) fontSizeVal.textContent = `${fontSize}px`;

    if (imageMetaBadge) {
      imageMetaBadge.textContent = `${img.naturalWidth} \u00D7 ${img.naturalHeight} px \u2022 ${formatBytes(file.size)}`;
    }

    render();
    showToast('Photo loaded! Configure your watermark.', 'success');
  };
  img.src = url;
}

function loadDemoPhoto() {
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 1200;
  demoCanvas.height = 800;
  const ctx = demoCanvas.getContext('2d');
  if (!ctx) return;

  // Scenic sunset landscape demo
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 800);
  skyGrad.addColorStop(0, '#f97316');
  skyGrad.addColorStop(0.4, '#e11d48');
  skyGrad.addColorStop(0.7, '#4f46e5');
  skyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 800);

  // Sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(600, 420, 120, 0, Math.PI * 2);
  ctx.fill();

  // Mountain silhouettes
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(0, 800);
  ctx.lineTo(200, 450);
  ctx.lineTo(450, 600);
  ctx.lineTo(750, 400);
  ctx.lineTo(1050, 580);
  ctx.lineTo(1200, 500);
  ctx.lineTo(1200, 800);
  ctx.closePath();
  ctx.fill();

  demoCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'scenic_sunset.png', { type: 'image/png' });
      loadBaseImage(file);
    }
  });
}

function render() {
  if (!canvas || !baseImage) return;

  const width = baseImage.naturalWidth;
  const height = baseImage.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Original Image
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(baseImage, 0, 0);

  // 2. Measure Watermark
  if (watermarkType === 'text') {
    if (!watermarkText.trim()) return;

    ctx.font = buildCanvasFont(fontSize, fontFamily, true);
    const metrics = ctx.measureText(watermarkText);
    const wmW = metrics.width;
    const wmH = fontSize;

    const rad = (rotationDeg * Math.PI) / 180;

    if (positionMode === 'tile') {
      // Draw repeating pattern
      const points = calculateTiledPositions(width, height, wmW * 1.8, wmH * 4.5);
      points.forEach((pt) => {
        drawRotatedText(ctx, watermarkText, pt.x, pt.y, rad);
      });
    } else {
      let pt = customPos;
      if (!pt) {
        const padding = Math.round(width * 0.03);
        pt = calculateWatermarkPosition(width, height, wmW, wmH, gridPosition, padding);
      }
      drawRotatedText(ctx, watermarkText, pt.x, pt.y, rad);
    }
  } else if (watermarkType === 'image' && logoImage) {
    const targetW = width * logoScale;
    const targetH = (logoImage.naturalHeight / logoImage.naturalWidth) * targetW;
    const rad = (rotationDeg * Math.PI) / 180;

    if (positionMode === 'tile') {
      const points = calculateTiledPositions(width, height, targetW * 1.6, targetH * 1.8);
      points.forEach((pt) => {
        drawRotatedImage(ctx, logoImage!, pt.x, pt.y, targetW, targetH, rad);
      });
    } else {
      let pt = customPos;
      if (!pt) {
        const padding = Math.round(width * 0.03);
        pt = calculateWatermarkPosition(width, height, targetW, targetH, gridPosition, padding);
      }
      drawRotatedImage(ctx, logoImage, pt.x, pt.y, targetW, targetH, rad);
    }
  }
}

function drawRotatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  rad: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rad);

  // Dual-tone outline for high legibility on any background
  ctx.font = buildCanvasFont(fontSize, fontFamily, true);
  ctx.textBaseline = 'top';

  // Subtle dark drop-shadow stroke
  ctx.strokeStyle = `rgba(0, 0, 0, ${textOpacity * 0.6})`;
  ctx.lineWidth = Math.max(2, Math.round(fontSize / 10));
  ctx.strokeText(text, 0, 0);

  // Main colored fill
  ctx.fillStyle = hexToRgba(textColor, textOpacity);
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

function drawRotatedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rad);
  ctx.globalAlpha = textOpacity;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function handleDownload() {
  if (!canvas || !baseImage) return;

  const format = formatSelect?.value || 'image/png';
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
  const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'watermarked';

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_watermark.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Watermarked image downloaded!', 'success');
    },
    format,
    0.95
  );
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWatermarkTool);
} else {
  initWatermarkTool();
}
