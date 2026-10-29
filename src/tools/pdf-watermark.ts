/**
 * PDF Watermark Tool (100% In-Browser)
 * Applies customized text or image watermarks with live interactive canvas preview.
 */
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { applyPdfWatermark, type PdfWatermarkConfig } from '../utils/pdfWatermarkUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

import '../utils/pdfWorkerSetup.ts';

let loadedPdfBytes: Uint8Array | null = null;
let originalFileName = 'document.pdf';
let totalPages = 1;
let watermarkImageBytes: Uint8Array | null = null;
let watermarkImageFormat: 'png' | 'jpg' = 'png';
let watermarkImageBitmap: ImageBitmap | null = null;

// DOM Elements
const dropzone = document.getElementById('watermark-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('watermark-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('watermark-workspace') as HTMLElement | null;
const previewCanvas = document.getElementById('watermark-preview-canvas') as HTMLCanvasElement | null;
const overlayCanvas = document.getElementById('watermark-overlay-canvas') as HTMLCanvasElement | null;

const typeTextRadio = document.getElementById('wm-type-text') as HTMLInputElement | null;
const typeImageRadio = document.getElementById('wm-type-image') as HTMLInputElement | null;
const textSection = document.getElementById('wm-text-section') as HTMLElement | null;
const imageSection = document.getElementById('wm-image-section') as HTMLElement | null;

const textInput = document.getElementById('wm-text-input') as HTMLInputElement | null;
const fontSizeSlider = document.getElementById('wm-fontsize-slider') as HTMLInputElement | null;
const fontSizeVal = document.getElementById('wm-fontsize-val') as HTMLElement | null;
const colorPicker = document.getElementById('wm-color-picker') as HTMLInputElement | null;
const opacitySlider = document.getElementById('wm-opacity-slider') as HTMLInputElement | null;
const opacityVal = document.getElementById('wm-opacity-val') as HTMLElement | null;
const rotationSlider = document.getElementById('wm-rotation-slider') as HTMLInputElement | null;
const rotationVal = document.getElementById('wm-rotation-val') as HTMLElement | null;

const imageFileInput = document.getElementById('wm-image-file-input') as HTMLInputElement | null;
const imageFileName = document.getElementById('wm-image-filename') as HTMLElement | null;

const pagesSelect = document.getElementById('wm-pages-select') as HTMLSelectElement | null;
const customRangeInput = document.getElementById('wm-custom-range') as HTMLInputElement | null;
const customRangeRow = document.getElementById('wm-custom-range-row') as HTMLElement | null;

const downloadBtn = document.getElementById('watermark-download-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('watermark-reset-btn') as HTMLButtonElement | null;
const metaBadge = document.getElementById('watermark-meta-badge') as HTMLElement | null;

export function initWatermarkTool(): void {
  if (!dropzone || !fileInput || !previewCanvas) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handlePdfFile(file);
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
    if (file) handlePdfFile(file);
  });

  // Mode toggles
  typeTextRadio?.addEventListener('change', () => {
    textSection?.classList.remove('hidden');
    imageSection?.classList.add('hidden');
    drawOverlay();
  });
  typeImageRadio?.addEventListener('change', () => {
    textSection?.classList.add('hidden');
    imageSection?.classList.remove('hidden');
    drawOverlay();
  });

  // Slider change listeners
  textInput?.addEventListener('input', drawOverlay);
  colorPicker?.addEventListener('input', drawOverlay);

  fontSizeSlider?.addEventListener('input', () => {
    if (fontSizeVal && fontSizeSlider) fontSizeVal.textContent = `${fontSizeSlider.value} pt`;
    drawOverlay();
  });

  opacitySlider?.addEventListener('input', () => {
    if (opacityVal && opacitySlider) opacityVal.textContent = `${opacitySlider.value}%`;
    drawOverlay();
  });

  rotationSlider?.addEventListener('input', () => {
    if (rotationVal && rotationSlider) rotationVal.textContent = `${rotationSlider.value}°`;
    drawOverlay();
  });

  imageFileInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      if (imageFileName) imageFileName.textContent = file.name;
      const buf = await file.arrayBuffer();
      watermarkImageBytes = new Uint8Array(buf);
      watermarkImageFormat = file.type === 'image/jpeg' ? 'jpg' : 'png';
      watermarkImageBitmap = await createImageBitmap(file);
      drawOverlay();
    }
  });

  pagesSelect?.addEventListener('change', () => {
    if (pagesSelect.value === 'custom') {
      customRangeRow?.classList.remove('hidden');
    } else {
      customRangeRow?.classList.add('hidden');
    }
  });

  resetBtn?.addEventListener('click', () => {
    loadedPdfBytes = null;
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);
}

async function handlePdfFile(file: File) {
  try {
    originalFileName = file.name;
    const buf = await file.arrayBuffer();
    loadedPdfBytes = new Uint8Array(buf);

    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    const pdfJsDoc = await pdfjsLib.getDocument({ data: loadedPdfBytes }).promise;
    totalPages = pdfJsDoc.numPages;

    if (metaBadge) {
      metaBadge.textContent = `${totalPages} ${totalPages === 1 ? 'page' : 'pages'} \u2022 ${formatBytes(file.size)}`;
    }

    const page = await pdfJsDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    if (previewCanvas) {
      previewCanvas.width = viewport.width;
      previewCanvas.height = viewport.height;
      const ctx = previewCanvas.getContext('2d');
      if (ctx) {
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas: previewCanvas,
        }).promise;
      }
    }

    drawOverlay();
    showToast('PDF loaded! Customize your watermark.', 'success');
  } catch (err: any) {
    showToast('Failed to load PDF: ' + err.message, 'error');
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function drawOverlay() {
  if (!overlayCanvas || !previewCanvas) return;

  overlayCanvas.width = previewCanvas.width;
  overlayCanvas.height = previewCanvas.height;
  const ctx = overlayCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  const isImage = typeImageRadio?.checked;
  const opacity = parseInt(opacitySlider?.value || '35', 10) / 100;
  const rotationDeg = parseInt(rotationSlider?.value || '45', 10);
  const rotRad = (rotationDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(overlayCanvas.width / 2, overlayCanvas.height / 2);
  ctx.rotate(rotRad);
  ctx.globalAlpha = opacity;

  if (!isImage) {
    const text = (textInput?.value || 'CONFIDENTIAL').trim();
    const fontSize = parseInt(fontSizeSlider?.value || '48', 10) * 1.5;
    const color = colorPicker?.value || '#dc2626';

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
  } else if (watermarkImageBitmap) {
    const imgW = overlayCanvas.width * 0.45;
    const imgH = (watermarkImageBitmap.height / watermarkImageBitmap.width) * imgW;
    ctx.drawImage(watermarkImageBitmap, -imgW / 2, -imgH / 2, imgW, imgH);
  }

  ctx.restore();
}

async function handleDownload() {
  if (!loadedPdfBytes) return;

  try {
    if (downloadBtn) downloadBtn.disabled = true;
    showToast('Applying watermark to PDF...', 'info');

    const pdfDoc = await PDFDocument.load(loadedPdfBytes);
    const isImage = typeImageRadio?.checked;
    const opacity = parseInt(opacitySlider?.value || '35', 10) / 100;
    const rotation = parseInt(rotationSlider?.value || '45', 10);
    const pagesSelection = (pagesSelect?.value || 'all') as 'all' | 'odd' | 'even' | 'custom';
    const customRange = customRangeInput?.value || '';

    const config: PdfWatermarkConfig = {
      type: isImage ? 'image' : 'text',
      opacity,
      rotation,
      pagesSelection,
      customRange,
    };

    if (isImage) {
      if (!watermarkImageBytes) {
        showToast('Please upload a watermark image first.', 'info');
        return;
      }
      config.imageBytes = watermarkImageBytes;
      config.imageFormat = watermarkImageFormat;
    } else {
      config.text = textInput?.value || 'CONFIDENTIAL';
      config.fontSize = parseInt(fontSizeSlider?.value || '48', 10);
      config.color = hexToRgb(colorPicker?.value || '#dc2626');
    }

    await applyPdfWatermark(pdfDoc, config);

    const outputBytes = await pdfDoc.save();
    const blob = new Blob([outputBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_watermarked.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Watermarked PDF downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Watermark error:', err);
    showToast('Failed to apply watermark: ' + err.message, 'error');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWatermarkTool);
} else {
  initWatermarkTool();
}
