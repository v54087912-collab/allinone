import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument, renderPageToCanvas, type RenderedPdfPage } from '../utils/pdfRenderer.ts';
import {
  calculatePdfCropBox,
  parsePageRange,
  type NormalizedCropRect,
} from '../utils/pdfUtils.ts';
import type * as pdfjsLib from 'pdfjs-dist';

let sourceArrayBuffer: ArrayBuffer | null = null;
let currentPdfFile: File | null = null;
let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
let totalPages = 0;
let currentPageNumber = 1;

// Crop box state in normalized [0, 1] coordinates
let cropBox: NormalizedCropRect = {
  x: 0.05,
  y: 0.05,
  width: 0.9,
  height: 0.9,
};

// DOM Elements
const fileInput = document.getElementById('crop-file-input') as HTMLInputElement;
const dropzone = document.getElementById('crop-dropzone') as HTMLElement;
const workspace = document.getElementById('crop-workspace') as HTMLElement;
const docSummary = document.getElementById('crop-doc-summary') as HTMLElement;
const docNameEl = document.getElementById('crop-doc-name') as HTMLElement;
const docPagesEl = document.getElementById('crop-doc-pages') as HTMLElement;
const resetFileBtn = document.getElementById('crop-reset-btn') as HTMLButtonElement;

// Canvas & Stage
const stageContainer = document.getElementById('crop-stage-container') as HTMLElement;
const pageCanvas = document.getElementById('crop-page-canvas') as HTMLCanvasElement;
const cropBoxEl = document.getElementById('crop-box-element') as HTMLElement;

// Navigation
const prevPageBtn = document.getElementById('crop-prev-page') as HTMLButtonElement;
const nextPageBtn = document.getElementById('crop-next-page') as HTMLButtonElement;
const pageIndicator = document.getElementById('crop-page-indicator') as HTMLElement;
const pageJumpInput = document.getElementById('crop-jump-input') as HTMLInputElement;

// Presets
const presetButtons = document.querySelectorAll('[data-crop-preset]');
const marginTopInput = document.getElementById('crop-margin-top') as HTMLInputElement;
const marginBottomInput = document.getElementById('crop-margin-bottom') as HTMLInputElement;
const marginLeftInput = document.getElementById('crop-margin-left') as HTMLInputElement;
const marginRightInput = document.getElementById('crop-margin-right') as HTMLInputElement;

// Apply scope radios
const scopeAll = document.getElementById('crop-scope-all') as HTMLInputElement;
const scopeCurrent = document.getElementById('crop-scope-current') as HTMLInputElement;
const scopeOdd = document.getElementById('crop-scope-odd') as HTMLInputElement;
const scopeEven = document.getElementById('crop-scope-even') as HTMLInputElement;
const scopeCustom = document.getElementById('crop-scope-custom') as HTMLInputElement;
const customRangeInput = document.getElementById('crop-custom-range') as HTMLInputElement;

// Action & Progress
const applyBtn = document.getElementById('crop-apply-btn') as HTMLButtonElement;
const progressContainer = document.getElementById('crop-progress-container') as HTMLElement;
const progressBar = document.getElementById('crop-progress-bar') as HTMLElement;
const progressText = document.getElementById('crop-progress-text') as HTMLElement;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(1) + ' MB';
}

// Sync UI inputs with cropBox state
function updateInputsFromCropBox() {
  const topPct = Math.round(cropBox.y * 100);
  const bottomPct = Math.round((1 - (cropBox.y + cropBox.height)) * 100);
  const leftPct = Math.round(cropBox.x * 100);
  const rightPct = Math.round((1 - (cropBox.x + cropBox.width)) * 100);

  if (marginTopInput) marginTopInput.value = String(Math.max(0, topPct));
  if (marginBottomInput) marginBottomInput.value = String(Math.max(0, bottomPct));
  if (marginLeftInput) marginLeftInput.value = String(Math.max(0, leftPct));
  if (marginRightInput) marginRightInput.value = String(Math.max(0, rightPct));
}

// Update DOM visual crop box position & dimensions
function renderCropBox() {
  if (!stageContainer || !pageCanvas || !cropBoxEl) return;

  const rect = pageCanvas.getBoundingClientRect();
  const stageRect = stageContainer.getBoundingClientRect();

  const offsetX = rect.left - stageRect.left;
  const offsetY = rect.top - stageRect.top;

  const left = offsetX + rect.width * cropBox.x;
  const top = offsetY + rect.height * cropBox.y;
  const width = rect.width * cropBox.width;
  const height = rect.height * cropBox.height;

  cropBoxEl.style.left = `${left}px`;
  cropBoxEl.style.top = `${top}px`;
  cropBoxEl.style.width = `${width}px`;
  cropBoxEl.style.height = `${height}px`;

  updateInputsFromCropBox();
}

// Preset application
presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.getAttribute('data-crop-preset');
    if (preset === 'margins-5') {
      cropBox = { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
    } else if (preset === 'margins-10') {
      cropBox = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    } else if (preset === 'header-trim') {
      cropBox = { x: 0, y: 0.15, width: 1, height: 0.85 };
    } else if (preset === 'footer-trim') {
      cropBox = { x: 0, y: 0, width: 1, height: 0.85 };
    } else if (preset === 'top-half') {
      cropBox = { x: 0, y: 0, width: 1, height: 0.5 };
    } else if (preset === 'bottom-half') {
      cropBox = { x: 0, y: 0.5, width: 1, height: 0.5 };
    } else if (preset === 'reset') {
      cropBox = { x: 0, y: 0, width: 1, height: 1 };
    }
    renderCropBox();
  });
});

// Manual input change handlers
function updateCropBoxFromInputs() {
  const top = Math.max(0, Math.min(45, parseFloat(marginTopInput?.value || '0'))) / 100;
  const bottom = Math.max(0, Math.min(45, parseFloat(marginBottomInput?.value || '0'))) / 100;
  const left = Math.max(0, Math.min(45, parseFloat(marginLeftInput?.value || '0'))) / 100;
  const right = Math.max(0, Math.min(45, parseFloat(marginRightInput?.value || '0'))) / 100;

  cropBox = {
    x: left,
    y: top,
    width: Math.max(0.05, 1 - left - right),
    height: Math.max(0.05, 1 - top - bottom),
  };
  renderCropBox();
}

marginTopInput?.addEventListener('input', updateCropBoxFromInputs);
marginBottomInput?.addEventListener('input', updateCropBoxFromInputs);
marginLeftInput?.addEventListener('input', updateCropBoxFromInputs);
marginRightInput?.addEventListener('input', updateCropBoxFromInputs);

// Render Current Page
async function renderCurrentPage() {
  if (!pdfjsDoc || !pageCanvas) return;

  try {
    const rendered: RenderedPdfPage = await renderPageToCanvas(pdfjsDoc, currentPageNumber, 1.5);
    pageCanvas.width = rendered.width;
    pageCanvas.height = rendered.height;
    const ctx = pageCanvas.getContext('2d');
    ctx?.drawImage(rendered.canvas, 0, 0);

    if (pageIndicator) pageIndicator.textContent = `Page ${currentPageNumber} of ${totalPages}`;
    if (pageJumpInput) {
      pageJumpInput.value = String(currentPageNumber);
      pageJumpInput.max = String(totalPages);
    }
    if (prevPageBtn) prevPageBtn.disabled = currentPageNumber <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPageNumber >= totalPages;

    requestAnimationFrame(renderCropBox);
  } catch (err) {
    console.error('Failed to render PDF page:', err);
  }
}

// Page Navigation
prevPageBtn?.addEventListener('click', () => {
  if (currentPageNumber > 1) {
    currentPageNumber--;
    renderCurrentPage();
  }
});

nextPageBtn?.addEventListener('click', () => {
  if (currentPageNumber < totalPages) {
    currentPageNumber++;
    renderCurrentPage();
  }
});

pageJumpInput?.addEventListener('change', () => {
  const val = parseInt(pageJumpInput.value, 10);
  if (!isNaN(val) && val >= 1 && val <= totalPages) {
    currentPageNumber = val;
    renderCurrentPage();
  } else {
    pageJumpInput.value = String(currentPageNumber);
  }
});

window.addEventListener('resize', () => {
  renderCropBox();
});

// Interactive Drag & Resize on Visual Crop Box
let isDragging = false;
let activeHandle: string | null = null;
let startX = 0;
let startY = 0;
let initialCrop = { ...cropBox };

cropBoxEl?.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const handle = (e.target as HTMLElement).getAttribute('data-handle');
  activeHandle = handle || 'move';
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialCrop = { ...cropBox };
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
});

window.addEventListener('pointermove', (e) => {
  if (!isDragging || !pageCanvas) return;

  const rect = pageCanvas.getBoundingClientRect();
  const deltaNormX = (e.clientX - startX) / rect.width;
  const deltaNormY = (e.clientY - startY) / rect.height;

  if (activeHandle === 'move') {
    let newX = initialCrop.x + deltaNormX;
    let newY = initialCrop.y + deltaNormY;

    // Bounds clamp
    newX = Math.max(0, Math.min(1 - initialCrop.width, newX));
    newY = Math.max(0, Math.min(1 - initialCrop.height, newY));

    cropBox.x = newX;
    cropBox.y = newY;
  } else if (activeHandle) {
    let { x, y, width, height } = initialCrop;

    if (activeHandle.includes('e')) {
      width = Math.max(0.05, Math.min(1 - x, initialCrop.width + deltaNormX));
    }
    if (activeHandle.includes('s')) {
      height = Math.max(0.05, Math.min(1 - y, initialCrop.height + deltaNormY));
    }
    if (activeHandle.includes('w')) {
      const maxX = initialCrop.x + initialCrop.width - 0.05;
      const newX = Math.max(0, Math.min(maxX, initialCrop.x + deltaNormX));
      width = initialCrop.width + (initialCrop.x - newX);
      x = newX;
    }
    if (activeHandle.includes('n')) {
      const maxY = initialCrop.y + initialCrop.height - 0.05;
      const newY = Math.max(0, Math.min(maxY, initialCrop.y + deltaNormY));
      height = initialCrop.height + (initialCrop.y - newY);
      y = newY;
    }

    cropBox = { x, y, width, height };
  }

  renderCropBox();
});

window.addEventListener('pointerup', () => {
  isDragging = false;
  activeHandle = null;
});

// File Loading
async function loadFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Please select a valid PDF file.');
    return;
  }

  try {
    currentPdfFile = file;
    sourceArrayBuffer = await file.arrayBuffer();

    pdfjsDoc = await loadPdfDocument(sourceArrayBuffer);
    totalPages = pdfjsDoc.numPages;
    currentPageNumber = 1;

    if (docNameEl) docNameEl.textContent = file.name;
    if (docPagesEl) docPagesEl.textContent = `${totalPages} ${totalPages === 1 ? 'page' : 'pages'} (${formatBytes(file.size)})`;

    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');
    docSummary?.classList.remove('hidden');

    cropBox = { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
    await renderCurrentPage();
  } catch (err: any) {
    console.error('Failed to load PDF for cropping:', err);
    alert('Failed to read PDF document: ' + (err.message || String(err)));
  }
}

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
    if (e.dataTransfer?.files?.[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  dropzone.addEventListener('click', () => fileInput?.click());
}

fileInput?.addEventListener('change', () => {
  if (fileInput.files?.[0]) {
    loadFile(fileInput.files[0]);
    fileInput.value = '';
  }
});

resetFileBtn?.addEventListener('click', () => {
  sourceArrayBuffer = null;
  currentPdfFile = null;
  pdfjsDoc = null;
  totalPages = 0;
  workspace?.classList.add('hidden');
  dropzone?.classList.remove('hidden');
});

// Scope determination
function getPagesToCrop(): number[] {
  if (scopeCurrent?.checked) {
    return [currentPageNumber];
  }
  if (scopeOdd?.checked) {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 !== 0);
  }
  if (scopeEven?.checked) {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
  }
  if (scopeCustom?.checked) {
    return parsePageRange(customRangeInput?.value || '', totalPages);
  }
  // Default: All pages
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

// Lossless PDF Cropping Execution
applyBtn?.addEventListener('click', async () => {
  if (!sourceArrayBuffer || !currentPdfFile || totalPages === 0) return;

  try {
    applyBtn.disabled = true;
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';
    if (progressText) progressText.textContent = 'Parsing PDF document structure...';

    const pdfDoc = await PDFDocument.load(sourceArrayBuffer);
    const pagesToCrop = getPagesToCrop();

    if (pagesToCrop.length === 0) {
      alert('No pages selected to crop.');
      applyBtn.disabled = false;
      progressContainer?.classList.add('hidden');
      return;
    }

    const totalToCrop = pagesToCrop.length;

    for (let i = 0; i < totalToCrop; i++) {
      const pageNum = pagesToCrop[i];
      const percent = Math.round(10 + ((i + 1) / totalToCrop) * 80);

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `Applying crop to page ${pageNum} (${i + 1} of ${totalToCrop})...`;

      const page = pdfDoc.getPage(pageNum - 1);
      const mediaBox = page.getMediaBox();

      const cropPdf = calculatePdfCropBox(
        { x: mediaBox.x, y: mediaBox.y, width: mediaBox.width, height: mediaBox.height },
        cropBox
      );

      // In PDF, setCropBox defines the visible/printable region
      page.setCropBox(cropPdf.x, cropPdf.y, cropPdf.width, cropPdf.height);
      page.setMediaBox(cropPdf.x, cropPdf.y, cropPdf.width, cropPdf.height);
    }

    if (progressBar) progressBar.style.width = '95%';
    if (progressText) progressText.textContent = 'Serializing cropped PDF...';

    const croppedBytes = await pdfDoc.save();

    // Trigger download
    const blob = new Blob([croppedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = currentPdfFile.name.replace(/\.pdf$/i, '') || 'document';
    a.download = `${base}_cropped.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Cropped PDF downloaded successfully!';

    setTimeout(() => {
      progressContainer?.classList.add('hidden');
      applyBtn.disabled = false;
    }, 2000);
  } catch (err: any) {
    console.error('PDF crop error:', err);
    alert('Failed to crop PDF: ' + (err.message || String(err)));
    if (progressContainer) progressContainer.classList.add('hidden');
    applyBtn.disabled = false;
  }
});
