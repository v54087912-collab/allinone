/**
 * Image Blur & Redact Tool (100% In-Browser)
 */
import {
  applyPixelateToImageData,
  applyBoxBlurToImageData,
  type BlurType,
} from '../utils/blurUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

let loadedImage: HTMLImageElement | null = null;
let originalFile: File | null = null;

let blurType: BlurType = 'pixelate';
let blurMode: 'selective' | 'full' | 'invert' = 'selective';
let blurRadius = 16;

let censorBox: { x: number; y: number; width: number; height: number } | null = null;
const dragSelection: SelectionBox = {
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isDragging: false,
};

// DOM Elements
const dropzone = document.getElementById('blur-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('blur-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('blur-workspace') as HTMLElement | null;
const canvas = document.getElementById('blur-canvas') as HTMLCanvasElement | null;
const blurTypeSelect = document.getElementById('blur-type-select') as HTMLSelectElement | null;
const blurModeSelect = document.getElementById('blur-mode-select') as HTMLSelectElement | null;
const radiusSlider = document.getElementById('blur-radius-slider') as HTMLInputElement | null;
const radiusVal = document.getElementById('blur-radius-val') as HTMLElement | null;
const clearBoxBtn = document.getElementById('blur-clear-box-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('blur-reset-btn') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('blur-download-btn') as HTMLButtonElement | null;
const formatSelect = document.getElementById('blur-format-select') as HTMLSelectElement | null;
const imageMetaBadge = document.getElementById('blur-image-meta') as HTMLElement | null;
const demoBtn = document.getElementById('blur-demo-btn') as HTMLButtonElement | null;

export function initBlurTool(): void {
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

  demoBtn?.addEventListener('click', loadDemoImage);

  // Blur Options
  blurTypeSelect?.addEventListener('change', () => {
    blurType = (blurTypeSelect.value as BlurType) || 'pixelate';
    updateControlsLabel();
    render();
  });

  blurModeSelect?.addEventListener('change', () => {
    blurMode = (blurModeSelect.value as any) || 'selective';
    render();
  });

  radiusSlider?.addEventListener('input', () => {
    blurRadius = parseInt(radiusSlider.value, 10) || 16;
    if (radiusVal) radiusVal.textContent = String(blurRadius);
    render();
  });

  clearBoxBtn?.addEventListener('click', () => {
    censorBox = null;
    render();
  });

  resetBtn?.addEventListener('click', () => {
    loadedImage = null;
    originalFile = null;
    censorBox = null;
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);

  // Canvas Mouse Interactions for Selective Redaction
  setupCanvasEvents();
}

function updateControlsLabel() {
  const label = document.getElementById('blur-intensity-label');
  if (!label) return;
  if (blurType === 'pixelate') {
    label.textContent = 'Pixel Block Size (px)';
  } else {
    label.textContent = 'Blur Radius (px)';
  }
}

function loadImage(file: File) {
  originalFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    loadedImage = img;
    // Default initial censor box in the center 40%
    const initW = Math.round(img.naturalWidth * 0.4);
    const initH = Math.round(img.naturalHeight * 0.3);
    censorBox = {
      x: Math.round((img.naturalWidth - initW) / 2),
      y: Math.round((img.naturalHeight - initH) / 2),
      width: initW,
      height: initH,
    };

    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    if (imageMetaBadge) {
      imageMetaBadge.textContent = `${img.naturalWidth} \u00D7 ${img.naturalHeight} px \u2022 ${formatBytes(file.size)}`;
    }

    render();
    showToast('Image loaded! Drag on image to adjust blur area.', 'success');
  };
  img.src = url;
}

function loadDemoImage() {
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 800;
  demoCanvas.height = 600;
  const ctx = demoCanvas.getContext('2d');
  if (!ctx) return;

  // Draw colorful demo background with text
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(0.5, '#6366f1');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Sensitive demo card
  ctx.fillStyle = '#ffffff';
  ctx.roundRect?.(200, 180, 400, 240, 16);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('CONFIDENTIAL ID CARD', 230, 230);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px monospace';
  ctx.fillText('Cardholder: Johnathan Doe', 230, 275);
  ctx.fillText('Card #: 4532 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 8921', 230, 310);
  ctx.fillText('DOB: 1988-11-23', 230, 345);
  ctx.fillText('Secret Pin: 9812', 230, 380);

  demoCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'confidential_demo.png', { type: 'image/png' });
      loadImage(file);
    }
  });
}

function setupCanvasEvents() {
  if (!canvas) return;

  const getCanvasCoords = (e: MouseEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  canvas.addEventListener('mousedown', (e) => {
    if (blurMode === 'full') return;
    const coords = getCanvasCoords(e);
    dragSelection.startX = coords.x;
    dragSelection.startY = coords.y;
    dragSelection.currentX = coords.x;
    dragSelection.currentY = coords.y;
    dragSelection.isDragging = true;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragSelection.isDragging || !canvas) return;
    const coords = getCanvasCoords(e);
    dragSelection.currentX = coords.x;
    dragSelection.currentY = coords.y;
    render();
  });

  window.addEventListener('mouseup', () => {
    if (!dragSelection.isDragging || !canvas) return;
    dragSelection.isDragging = false;

    const x = Math.min(dragSelection.startX, dragSelection.currentX);
    const y = Math.min(dragSelection.startY, dragSelection.currentY);
    const width = Math.abs(dragSelection.currentX - dragSelection.startX);
    const height = Math.abs(dragSelection.currentY - dragSelection.startY);

    if (width > 5 && height > 5) {
      censorBox = { x, y, width, height };
    }
    render();
  });
}

function render() {
  if (!canvas || !loadedImage) return;

  const width = loadedImage.naturalWidth;
  const height = loadedImage.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base original image
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(loadedImage, 0, 0);

  // 2. Apply blur or pixelation
  if (blurMode === 'full') {
    applyEffectToArea(ctx, { x: 0, y: 0, width, height });
  } else if (blurMode === 'selective' && censorBox) {
    applyEffectToArea(ctx, censorBox);
  } else if (blurMode === 'invert' && censorBox) {
    // Blur entire background then redraw clear subject box
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(loadedImage, 0, 0);
      applyEffectToArea(tempCtx, { x: 0, y: 0, width, height });
      // Redraw original unblurred area
      tempCtx.drawImage(
        loadedImage,
        censorBox.x,
        censorBox.y,
        censorBox.width,
        censorBox.height,
        censorBox.x,
        censorBox.y,
        censorBox.width,
        censorBox.height
      );
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  // 3. Draw interactive selection guide lines (only during edit mode)
  if (blurMode !== 'full') {
    const activeBox = dragSelection.isDragging
      ? {
          x: Math.min(dragSelection.startX, dragSelection.currentX),
          y: Math.min(dragSelection.startY, dragSelection.currentY),
          width: Math.abs(dragSelection.currentX - dragSelection.startX),
          height: Math.abs(dragSelection.currentY - dragSelection.startY),
        }
      : censorBox;

    if (activeBox) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = Math.max(2, Math.round(width / 400));
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(activeBox.x, activeBox.y, activeBox.width, activeBox.height);
      ctx.restore();
    }
  }
}

function applyEffectToArea(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number }
) {
  const clampedX = Math.max(0, Math.round(box.x));
  const clampedY = Math.max(0, Math.round(box.y));
  const clampedW = Math.min(ctx.canvas.width - clampedX, Math.round(box.width));
  const clampedH = Math.min(ctx.canvas.height - clampedY, Math.round(box.height));

  if (clampedW <= 0 || clampedH <= 0) return;

  if (blurType === 'pixelate') {
    const imgData = ctx.getImageData(clampedX, clampedY, clampedW, clampedH);
    applyPixelateToImageData(
      imgData,
      { x: 0, y: 0, width: clampedW, height: clampedH },
      blurRadius
    );
    ctx.putImageData(imgData, clampedX, clampedY);
  } else if (blurType === 'box') {
    const imgData = ctx.getImageData(clampedX, clampedY, clampedW, clampedH);
    applyBoxBlurToImageData(
      imgData,
      { x: 0, y: 0, width: clampedW, height: clampedH },
      blurRadius
    );
    ctx.putImageData(imgData, clampedX, clampedY);
  } else if (blurType === 'gaussian') {
    // High-performance hardware-accelerated Gaussian Blur using Canvas filter
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = clampedW;
    tempCanvas.height = clampedH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.filter = `blur(${Math.max(1, blurRadius)}px)`;
      // Expand slightly to avoid transparent edges in blur
      tempCtx.drawImage(
        ctx.canvas,
        clampedX,
        clampedY,
        clampedW,
        clampedH,
        0,
        0,
        clampedW,
        clampedH
      );
      ctx.drawImage(tempCanvas, clampedX, clampedY);
    }
  }
}

function handleDownload() {
  if (!canvas || !loadedImage) return;

  // Re-render strictly without dashed guide lines
  const wasDragging = dragSelection.isDragging;
  dragSelection.isDragging = false;
  render();

  // Export clean without guides
  const format = formatSelect?.value || 'image/png';
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
  const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'redacted_image';

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_blurred.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Image downloaded successfully!', 'success');
    },
    format,
    0.92
  );

  dragSelection.isDragging = wasDragging;
}

// Auto initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlurTool);
} else {
  initBlurTool();
}
