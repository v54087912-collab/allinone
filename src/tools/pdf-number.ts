/**
 * PDF Page Numbering Tool (100% In-Browser)
 */
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  stampPageNumbers,
  formatPageNumberText,
  calculatePageNumberCoords,
  type PageNumberPosition,
} from '../utils/pdfNumberUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

import '../utils/pdfWorkerSetup.ts';

let loadedPdfBytes: Uint8Array | null = null;
let originalFileName = 'document.pdf';
let totalPages = 1;
let previewPageCanvas: HTMLCanvasElement | null = null;

// DOM Elements
const dropzone = document.getElementById('number-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('number-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('number-workspace') as HTMLElement | null;
const canvas = document.getElementById('number-preview-canvas') as HTMLCanvasElement | null;
const formatSelect = document.getElementById('number-format-select') as HTMLSelectElement | null;
const posSelect = document.getElementById('number-pos-select') as HTMLSelectElement | null;
const fontSizeSelect = document.getElementById('number-fontsize-select') as HTMLSelectElement | null;
const marginSlider = document.getElementById('number-margin-slider') as HTMLInputElement | null;
const marginVal = document.getElementById('number-margin-val') as HTMLElement | null;
const startNumInput = document.getElementById('number-start-input') as HTMLInputElement | null;
const rangeInput = document.getElementById('number-range-input') as HTMLInputElement | null;
const skipFirstCheck = document.getElementById('number-skip-first') as HTMLInputElement | null;
const downloadBtn = document.getElementById('number-download-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('number-reset-btn') as HTMLButtonElement | null;
const metaBadge = document.getElementById('number-meta-badge') as HTMLElement | null;

export function initNumberTool(): void {
  if (!dropzone || !fileInput || !canvas) return;
  previewPageCanvas = canvas;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
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
    if (file) handleFile(file);
  });

  // Re-render preview on setting changes
  [formatSelect, posSelect, fontSizeSelect, startNumInput, rangeInput].forEach((el) => {
    el?.addEventListener('change', renderPreviewOverlay);
  });

  marginSlider?.addEventListener('input', () => {
    if (marginVal) marginVal.textContent = `${marginSlider.value} pt`;
    renderPreviewOverlay();
  });

  skipFirstCheck?.addEventListener('change', () => {
    if (skipFirstCheck.checked && rangeInput) {
      rangeInput.value = '2-';
    } else if (rangeInput) {
      rangeInput.value = '';
    }
    renderPreviewOverlay();
  });

  resetBtn?.addEventListener('click', () => {
    loadedPdfBytes = null;
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);
}

async function handleFile(file: File) {
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

    // Render page 1 to base canvas for visual preview
    const page = await pdfJsDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    if (previewPageCanvas) {
      previewPageCanvas.width = viewport.width;
      previewPageCanvas.height = viewport.height;
      const ctx = previewPageCanvas.getContext('2d');
      if (ctx) {
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas: previewPageCanvas,
        }).promise;
      }
    }

    renderPreviewOverlay();
    showToast('PDF loaded! Customize your page numbering.', 'success');
  } catch (err: any) {
    showToast('Failed to load PDF: ' + err.message, 'error');
  }
}

function renderPreviewOverlay() {
  const overlayCanvas = document.getElementById('number-overlay-canvas') as HTMLCanvasElement | null;
  if (!overlayCanvas || !previewPageCanvas) return;

  overlayCanvas.width = previewPageCanvas.width;
  overlayCanvas.height = previewPageCanvas.height;
  const ctx = overlayCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  const format = formatSelect?.value || 'Page {page} of {total}';
  const pos = (posSelect?.value || 'bottom-center') as PageNumberPosition;
  const fontSize = parseInt(fontSizeSelect?.value || '11', 10) * 1.5; // Scale with viewport
  const margin = parseInt(marginSlider?.value || '30', 10) * 1.5;
  const startNum = parseInt(startNumInput?.value || '1', 10);

  const sampleText = formatPageNumberText(format, startNum, totalPages);
  ctx.font = `${fontSize}px sans-serif`;
  const metrics = ctx.measureText(sampleText);
  const textW = metrics.width;
  const textH = fontSize;

  const coords = calculatePageNumberCoords(
    overlayCanvas.width,
    overlayCanvas.height,
    textW,
    textH,
    pos,
    margin
  );

  // In HTML canvas, Y descends from top, so top-left coords:
  const canvasY = overlayCanvas.height - coords.y;

  // Draw highlight pill badge
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(coords.x - 6, canvasY - textH - 4, textW + 12, textH + 8);

  ctx.fillStyle = '#2563eb';
  ctx.fillText(sampleText, coords.x, canvasY - 4);
}

async function handleDownload() {
  if (!loadedPdfBytes) return;

  try {
    if (downloadBtn) downloadBtn.disabled = true;
    showToast('Stamping page numbers on PDF...', 'info');

    const pdfDoc = await PDFDocument.load(loadedPdfBytes);

    const format = formatSelect?.value || 'Page {page} of {total}';
    const position = (posSelect?.value || 'bottom-center') as PageNumberPosition;
    const fontSize = parseInt(fontSizeSelect?.value || '11', 10);
    const margin = parseInt(marginSlider?.value || '30', 10);
    const startNumber = parseInt(startNumInput?.value || '1', 10);
    const pagesRange = rangeInput?.value?.trim() || '';

    await stampPageNumbers(pdfDoc, {
      format,
      position,
      fontSize,
      margin,
      startNumber,
      pagesRange,
    });

    const outputBytes = await pdfDoc.save();
    const blob = new Blob([outputBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_numbered.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Numbered PDF downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Page numbering error:', err);
    showToast('Failed to stamp numbers: ' + err.message, 'error');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNumberTool);
} else {
  initNumberTool();
}
