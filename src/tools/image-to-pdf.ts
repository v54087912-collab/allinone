import { PDFDocument, type PDFImage, rgb } from 'pdf-lib';
import {
  calculateImagePlacement,
  isJpegBytes,
  isPngBytes,
  type ImageToPdfConfig,
  type OrientationMode,
  type ImageFitMode,
} from '../utils/pdfUtils.ts';

interface QueuedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  previewUrl: string;
}

let imageQueue: QueuedImage[] = [];
let currentPreviewIndex = 0;

// Main DOM Elements
const fileInput = document.getElementById('img2pdf-file-input') as HTMLInputElement | null;
const dropzone = document.getElementById('img2pdf-dropzone') as HTMLElement | null;
const queueContainer = document.getElementById('img2pdf-queue-container') as HTMLElement | null;
const itemsList = document.getElementById('img2pdf-items-list') as HTMLElement | null;
const countBadge = document.getElementById('img2pdf-count-badge') as HTMLElement | null;
const generateBtn = document.getElementById('img2pdf-generate-btn') as HTMLButtonElement | null;
const previewBtn = document.getElementById('img2pdf-preview-btn') as HTMLButtonElement | null;
const clearAllBtn = document.getElementById('img2pdf-clear-all') as HTMLButtonElement | null;
const addMoreBtn = document.getElementById('img2pdf-add-more') as HTMLButtonElement | null;
const progressContainer = document.getElementById('img2pdf-progress-container') as HTMLElement | null;
const progressBar = document.getElementById('img2pdf-progress-bar') as HTMLElement | null;
const progressText = document.getElementById('img2pdf-progress-text') as HTMLElement | null;

// Settings Controls
const pageSizeSelect = document.getElementById('img2pdf-page-size') as HTMLSelectElement | null;
const orientationSelect = document.getElementById('img2pdf-orientation') as HTMLSelectElement | null;
const marginSelect = document.getElementById('img2pdf-margin') as HTMLSelectElement | null;
const fitSelect = document.getElementById('img2pdf-fit') as HTMLSelectElement | null;
const docTitleInput = document.getElementById('img2pdf-title') as HTMLInputElement | null;

// Preview Modal Elements
const previewModal = document.getElementById('img2pdf-preview-modal') as HTMLElement | null;
const previewModalClose = document.getElementById('preview-modal-close') as HTMLButtonElement | null;
const previewCanvas = document.getElementById('img2pdf-preview-canvas') as HTMLCanvasElement | null;
const previewPrevBtn = document.getElementById('preview-prev-btn') as HTMLButtonElement | null;
const previewNextBtn = document.getElementById('preview-next-btn') as HTMLButtonElement | null;
const previewPageCounter = document.getElementById('preview-page-counter') as HTMLElement | null;
const previewPaperBadge = document.getElementById('preview-paper-badge') as HTMLElement | null;
const previewPageMeta = document.getElementById('preview-page-meta') as HTMLElement | null;
const previewCurrentFile = document.getElementById('preview-current-file') as HTMLElement | null;
const previewThumbnails = document.getElementById('preview-thumbnails') as HTMLElement | null;
const previewDownloadBtn = document.getElementById('preview-download-btn') as HTMLButtonElement | null;
const previewMobileDownloadBtn = document.getElementById('preview-mobile-download-btn') as HTMLButtonElement | null;

function getConfig(): ImageToPdfConfig {
  return {
    pageSize: (pageSizeSelect?.value || 'a4') as any,
    orientation: (orientationSelect?.value || 'auto') as OrientationMode,
    margin: (marginSelect?.value || 'none') as any,
    fit: (fitSelect?.value || 'contain') as ImageFitMode,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(1) + ' MB';
}

function updateUI() {
  const count = imageQueue.length;
  if (countBadge) countBadge.textContent = `${count} ${count === 1 ? 'image' : 'images'}`;

  if (count === 0) {
    queueContainer?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
    if (generateBtn) generateBtn.disabled = true;
    if (previewBtn) previewBtn.disabled = true;
    closePreview();
    return;
  }

  queueContainer?.classList.remove('hidden');
  if (generateBtn) generateBtn.disabled = false;
  if (previewBtn) previewBtn.disabled = false;

  renderQueue();

  // If preview is open, update it
  if (previewModal && !previewModal.classList.contains('hidden')) {
    if (currentPreviewIndex >= imageQueue.length) {
      currentPreviewIndex = Math.max(0, imageQueue.length - 1);
    }
    renderPreview();
    renderThumbnails();
  }
}

function renderQueue() {
  if (!itemsList) return;
  itemsList.innerHTML = '';

  imageQueue.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className =
      'flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 transition-all text-xs';

    item.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <span class="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
          ${idx + 1}
        </span>
        <img src="${img.previewUrl}" alt="Preview" class="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900 cursor-pointer hover:opacity-80 transition-opacity" data-action="preview-page" data-idx="${idx}" title="Click to preview page ${idx + 1}" />
        <div class="min-w-0">
          <div class="font-medium text-slate-900 dark:text-white truncate" title="${img.name}">${img.name}</div>
          <div class="text-slate-500 text-[11px]">${img.width} &times; ${img.height} px &bull; ${formatBytes(img.size)}</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <button type="button" data-action="preview-page" data-idx="${idx}" class="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer" title="Preview This Page">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        </button>
        <button type="button" data-action="up" data-idx="${idx}" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" ${idx === 0 ? 'disabled' : ''} title="Move Up">
          &uarr;
        </button>
        <button type="button" data-action="down" data-idx="${idx}" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" ${idx === imageQueue.length - 1 ? 'disabled' : ''} title="Move Down">
          &darr;
        </button>
        <button type="button" data-action="delete" data-idx="${idx}" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer" title="Remove">
          &times;
        </button>
      </div>
    `;

    itemsList.appendChild(item);
  });
}

// Queue interaction events
itemsList?.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('button, img');
  if (!target) return;

  const action = target.getAttribute('data-action');
  const idx = parseInt(target.getAttribute('data-idx') || '-1', 10);
  if (idx < 0) return;

  if (action === 'preview-page') {
    openPreview(idx);
  } else if (action === 'up' && idx > 0) {
    const temp = imageQueue[idx];
    imageQueue[idx] = imageQueue[idx - 1];
    imageQueue[idx - 1] = temp;
    updateUI();
  } else if (action === 'down' && idx < imageQueue.length - 1) {
    const temp = imageQueue[idx];
    imageQueue[idx] = imageQueue[idx + 1];
    imageQueue[idx + 1] = temp;
    updateUI();
  } else if (action === 'delete') {
    URL.revokeObjectURL(imageQueue[idx].previewUrl);
    imageQueue.splice(idx, 1);
    updateUI();
  }
});

// File processing
async function addFiles(files: FileList | File[]) {
  const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (validFiles.length === 0) return;

  for (const file of validFiles) {
    const previewUrl = URL.createObjectURL(file);
    const dimensions = await getImageDimensions(previewUrl);

    imageQueue.push({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      previewUrl,
    });
  }

  updateUI();
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = url;
  });
}

// Drag & drop
if (dropzone) {
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
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  });

  dropzone.addEventListener('click', () => fileInput?.click());
}

fileInput?.addEventListener('change', () => {
  if (fileInput.files) {
    addFiles(fileInput.files);
    fileInput.value = '';
  }
});

addMoreBtn?.addEventListener('click', () => fileInput?.click());

clearAllBtn?.addEventListener('click', () => {
  imageQueue.forEach(img => URL.revokeObjectURL(img.previewUrl));
  imageQueue = [];
  updateUI();
});

// React to option changes while preview is open
[pageSizeSelect, orientationSelect, marginSelect, fitSelect].forEach((el) => {
  el?.addEventListener('change', () => {
    if (previewModal && !previewModal.classList.contains('hidden')) {
      renderPreview();
    }
  });
});

// ============================================================================
// Robust Image Embedding (Fixes "SOI not found in JPEG" & Format Incompatibilities)
// ============================================================================

/**
 * Re-encodes an image into standard PNG bytes using the browser's native HTMLImageElement + Canvas pipeline.
 * This handles any format the browser can render (WebP, AVIF, BMP, GIF, corrupted/non-SOI JPEG)
 * and produces a guaranteed valid PNG for pdfDoc.embedPng.
 */
function reencodeImageToPng(sourceUrl: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context creation failed'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          try {
            const ab = await blob.arrayBuffer();
            resolve(new Uint8Array(ab));
          } catch (e) {
            reject(e);
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for browser canvas decoding'));
    };

    img.src = sourceUrl;
  });
}

/**
 * Safely embeds any image into a PDFDocument.
 * Uses native embedJpg/embedPng when magic bytes match, and gracefully falls back
 * to HTML5 Canvas re-encoding to 100% compliant PNG to completely prevent "SOI not found in JPEG"
 * or format incompatibility crashes.
 */
async function safelyEmbedImage(
  pdfDoc: PDFDocument,
  file: File,
  previewUrl: string
): Promise<PDFImage> {
  let bytes: Uint8Array | null = null;
  try {
    const ab = await file.arrayBuffer();
    bytes = new Uint8Array(ab);
  } catch (readErr) {
    console.warn('Failed to read file ArrayBuffer directly, falling back to canvas:', readErr);
  }

  // 1. If bytes start with JPEG SOI marker (0xFF, 0xD8), attempt native embedJpg
  if (bytes && isJpegBytes(bytes)) {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch (jpgErr) {
      console.warn('Native embedJpg failed (non-standard JPEG structure), falling back to canvas PNG:', jpgErr);
    }
  }

  // 2. If bytes start with PNG magic numbers, attempt native embedPng
  if (bytes && isPngBytes(bytes)) {
    try {
      return await pdfDoc.embedPng(bytes);
    } catch (pngErr) {
      console.warn('Native embedPng failed, falling back to canvas PNG:', pngErr);
    }
  }

  // 3. Fallback for WebP, AVIF, BMP, GIF, non-SOI JPEGs, or unsupported variants
  try {
    const cleanPngBytes = await reencodeImageToPng(previewUrl);
    return await pdfDoc.embedPng(cleanPngBytes);
  } catch (canvasErr: any) {
    throw new Error(`Failed to process image "${file.name}": ${canvasErr?.message || String(canvasErr)}`);
  }
}

// ============================================================================
// PDF Live Document Preview Implementation
// ============================================================================

function openPreview(pageIndex = 0) {
  if (imageQueue.length === 0) return;
  currentPreviewIndex = Math.max(0, Math.min(pageIndex, imageQueue.length - 1));

  if (previewModal) {
    previewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  renderPreview();
  renderThumbnails();
}

function closePreview() {
  if (previewModal) {
    previewModal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function renderThumbnails() {
  if (!previewThumbnails) return;
  previewThumbnails.innerHTML = '';

  imageQueue.forEach((img, idx) => {
    const thumbBtn = document.createElement('button');
    thumbBtn.type = 'button';
    const isActive = idx === currentPreviewIndex;

    thumbBtn.className = `flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
      isActive
        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/40 shadow-sm'
        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
    }`;

    thumbBtn.innerHTML = `
      <img src="${img.previewUrl}" alt="P${idx + 1}" class="w-6 h-6 object-cover rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
      <span>P${idx + 1}</span>
    `;

    thumbBtn.addEventListener('click', () => {
      currentPreviewIndex = idx;
      renderPreview();
      renderThumbnails();
    });

    previewThumbnails.appendChild(thumbBtn);
  });
}

function renderPreview() {
  if (!previewCanvas || imageQueue.length === 0) return;
  const currentItem = imageQueue[currentPreviewIndex];
  if (!currentItem) return;

  const config = getConfig();
  const placement = calculateImagePlacement(currentItem.width, currentItem.height, config);

  // Update Page Counter & Buttons
  if (previewPageCounter) {
    previewPageCounter.textContent = `Page ${currentPreviewIndex + 1} of ${imageQueue.length}`;
  }
  if (previewPrevBtn) {
    previewPrevBtn.disabled = currentPreviewIndex === 0;
  }
  if (previewNextBtn) {
    previewNextBtn.disabled = currentPreviewIndex === imageQueue.length - 1;
  }

  // Update Meta Badges
  if (previewPaperBadge) {
    const sizeName = config.pageSize === 'fit' ? 'Fit to Image' : config.pageSize.toUpperCase();
    const orient = placement.pageWidth > placement.pageHeight ? 'Landscape' : 'Portrait';
    previewPaperBadge.textContent = `${sizeName} ${orient}`;
  }

  if (previewPageMeta) {
    const mmW = Math.round((placement.pageWidth * 25.4) / 72);
    const mmH = Math.round((placement.pageHeight * 25.4) / 72);
    const marginMm = config.margin === 'none' ? '0 mm' : config.margin === 'small' ? '7 mm' : config.margin === 'normal' ? '13 mm' : '19 mm';
    previewPageMeta.textContent = `${mmW} \u00D7 ${mmH} mm (${Math.round(placement.pageWidth)} \u00D7 ${Math.round(placement.pageHeight)} pt) \u2022 ${marginMm} margin`;
  }

  if (previewCurrentFile) {
    previewCurrentFile.textContent = `${currentItem.name} (${currentItem.width} \u00D7 ${currentItem.height} px)`;
    previewCurrentFile.title = currentItem.name;
  }

  // Draw on Canvas
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return;

  // Use sharp HiDPI scaling
  const dpr = window.devicePixelRatio || 2;
  const targetWidth = placement.pageWidth;
  const targetHeight = placement.pageHeight;

  previewCanvas.width = targetWidth * dpr;
  previewCanvas.height = targetHeight * dpr;
  previewCanvas.style.aspectRatio = `${targetWidth} / ${targetHeight}`;

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Draw Clean White Paper Sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. If Margins > 0, draw subtle printable area guide
  const marginPt = config.margin === 'small' ? 20 : config.margin === 'normal' ? 36 : config.margin === 'large' ? 54 : 0;
  if (marginPt > 0 && config.pageSize !== 'fit') {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(marginPt, marginPt, targetWidth - marginPt * 2, targetHeight - marginPt * 2);
    ctx.restore();
  }

  // 3. Load & Draw Image
  const img = new Image();
  img.onload = () => {
    ctx.save();
    // Clip to page bounds if cover mode might overflow
    if (config.fit === 'cover') {
      ctx.beginPath();
      ctx.rect(0, 0, targetWidth, targetHeight);
      ctx.clip();
    }

    ctx.drawImage(img, placement.x, placement.y, placement.width, placement.height);
    ctx.restore();
    ctx.restore();
  };

  img.src = currentItem.previewUrl;
}

// Preview Event Listeners
previewBtn?.addEventListener('click', () => openPreview(0));
previewModalClose?.addEventListener('click', closePreview);

previewPrevBtn?.addEventListener('click', () => {
  if (currentPreviewIndex > 0) {
    currentPreviewIndex--;
    renderPreview();
    renderThumbnails();
  }
});

previewNextBtn?.addEventListener('click', () => {
  if (currentPreviewIndex < imageQueue.length - 1) {
    currentPreviewIndex++;
    renderPreview();
    renderThumbnails();
  }
});

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (!previewModal || previewModal.classList.contains('hidden')) return;

  if (e.key === 'ArrowLeft' && currentPreviewIndex > 0) {
    currentPreviewIndex--;
    renderPreview();
    renderThumbnails();
  } else if (e.key === 'ArrowRight' && currentPreviewIndex < imageQueue.length - 1) {
    currentPreviewIndex++;
    renderPreview();
    renderThumbnails();
  } else if (e.key === 'Escape') {
    closePreview();
  }
});

// Backdrop click to close
previewModal?.addEventListener('click', (e) => {
  if (e.target === previewModal) {
    closePreview();
  }
});

// ============================================================================
// PDF Generation & Download
// ============================================================================

async function generatePdf() {
  if (imageQueue.length === 0) return;

  try {
    if (generateBtn) generateBtn.disabled = true;
    if (previewDownloadBtn) previewDownloadBtn.disabled = true;
    if (previewMobileDownloadBtn) previewMobileDownloadBtn.disabled = true;

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '5%';
    if (progressText) progressText.textContent = 'Initializing PDF document...';

    const pdfDoc = await PDFDocument.create();
    const config = getConfig();

    const title = docTitleInput?.value.trim();
    if (title) {
      pdfDoc.setTitle(title);
    }
    pdfDoc.setProducer('Toolora (100% In-Browser)');

    const total = imageQueue.length;

    for (let i = 0; i < total; i++) {
      const item = imageQueue[i];
      const percent = Math.round(((i + 1) / total) * 88);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `Processing image ${i + 1} of ${total}: ${item.name}`;

      // Safely embed image without any SOI crash
      const embeddedImage = await safelyEmbedImage(pdfDoc, item.file, item.previewUrl);

      const placement = calculateImagePlacement(item.width, item.height, config);

      const page = pdfDoc.addPage([placement.pageWidth, placement.pageHeight]);

      // Fill white background sheet
      page.drawRectangle({
        x: 0,
        y: 0,
        width: placement.pageWidth,
        height: placement.pageHeight,
        color: rgb(1, 1, 1),
      });

      page.drawImage(embeddedImage, {
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
      });
    }

    if (progressBar) progressBar.style.width = '94%';
    if (progressText) progressText.textContent = 'Finalizing PDF bytes...';

    const pdfBytes = await pdfDoc.save();

    // Trigger download
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const baseName = (title || imageQueue[0].name.replace(/\.[^/.]+$/, '')) || 'document';
    a.download = `${baseName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'PDF downloaded successfully!';

    setTimeout(() => {
      progressContainer?.classList.add('hidden');
      if (generateBtn) generateBtn.disabled = false;
      if (previewDownloadBtn) previewDownloadBtn.disabled = false;
      if (previewMobileDownloadBtn) previewMobileDownloadBtn.disabled = false;
    }, 2500);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    alert('Failed to generate PDF: ' + (err.message || String(err)));
    if (progressContainer) progressContainer.classList.add('hidden');
    if (generateBtn) generateBtn.disabled = false;
    if (previewDownloadBtn) previewDownloadBtn.disabled = false;
    if (previewMobileDownloadBtn) previewMobileDownloadBtn.disabled = false;
  }
}

generateBtn?.addEventListener('click', generatePdf);
previewDownloadBtn?.addEventListener('click', generatePdf);
previewMobileDownloadBtn?.addEventListener('click', generatePdf);
