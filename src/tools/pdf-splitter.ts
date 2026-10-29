import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { loadPdfDocument, renderPageToCanvas } from '../utils/pdfRenderer.ts';
import {
  parsePageRange,
  validatePageRange,
  chunkPagesEveryN,
  generateSplitFilename,
} from '../utils/pdfUtils.ts';
import type * as pdfjsLib from 'pdfjs-dist';

let sourceArrayBuffer: ArrayBuffer | null = null;
let currentPdfFile: File | null = null;
let totalPages = 0;
let selectedPages = new Set<number>();

// DOM Elements
const fileInput = document.getElementById('split-file-input') as HTMLInputElement;
const dropzone = document.getElementById('split-dropzone') as HTMLElement;
const controlsContainer = document.getElementById('split-controls-container') as HTMLElement;
const docSummary = document.getElementById('split-doc-summary') as HTMLElement;
const docNameEl = document.getElementById('split-doc-name') as HTMLElement;
const docPagesEl = document.getElementById('split-doc-pages') as HTMLElement;
const docSizeEl = document.getElementById('split-doc-size') as HTMLElement;

// Mode Radios
const modeExtract = document.getElementById('split-mode-extract') as HTMLInputElement;
const modeSingle = document.getElementById('split-mode-single') as HTMLInputElement;
const modeGroups = document.getElementById('split-mode-groups') as HTMLInputElement;
const modeEveryN = document.getElementById('split-mode-every-n') as HTMLInputElement;

const rangeInput = document.getElementById('split-range-input') as HTMLInputElement;
const groupsInput = document.getElementById('split-groups-input') as HTMLInputElement;
const everyNInput = document.getElementById('split-every-n-input') as HTMLInputElement;
const rangeHelp = document.getElementById('split-range-help') as HTMLElement;

// Page Grid Elements
const pagesGrid = document.getElementById('split-pages-grid') as HTMLElement;
const selectAllBtn = document.getElementById('split-select-all') as HTMLButtonElement;
const deselectAllBtn = document.getElementById('split-deselect-all') as HTMLButtonElement;
const invertSelectBtn = document.getElementById('split-invert-select') as HTMLButtonElement;
const selectedCountBadge = document.getElementById('split-selected-count') as HTMLElement;

// Action Buttons
const splitBtn = document.getElementById('split-process-btn') as HTMLButtonElement;
const resetBtn = document.getElementById('split-reset-btn') as HTMLButtonElement;
const progressContainer = document.getElementById('split-progress-container') as HTMLElement;
const progressBar = document.getElementById('split-progress-bar') as HTMLElement;
const progressText = document.getElementById('split-progress-text') as HTMLElement;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(1) + ' MB';
}

function updateSelectedCount() {
  if (selectedCountBadge) {
    selectedCountBadge.textContent = `${selectedPages.size} of ${totalPages} selected`;
  }
}

// Mode change handlers
function updateModeVisibility() {
  const isExtract = modeExtract?.checked;
  const isGroups = modeGroups?.checked;
  const isEveryN = modeEveryN?.checked;

  document.getElementById('split-box-extract')?.classList.toggle('hidden', !isExtract);
  document.getElementById('split-box-groups')?.classList.toggle('hidden', !isGroups);
  document.getElementById('split-box-every-n')?.classList.toggle('hidden', !isEveryN);

  // If in extract mode, sync range input with selectedPages
  if (isExtract && rangeInput) {
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    rangeInput.value = formatPagesToRanges(sorted);
  }
}

function formatPagesToRanges(pages: number[]): string {
  if (pages.length === 0) return '';
  const ranges: string[] = [];
  let start = pages[0];
  let end = pages[0];

  for (let i = 1; i < pages.length; i++) {
    if (pages[i] === end + 1) {
      end = pages[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = pages[i];
      end = pages[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

modeExtract?.addEventListener('change', updateModeVisibility);
modeSingle?.addEventListener('change', updateModeVisibility);
modeGroups?.addEventListener('change', updateModeVisibility);
modeEveryN?.addEventListener('change', updateModeVisibility);

// Range input typed by user
rangeInput?.addEventListener('input', () => {
  const val = rangeInput.value.trim();
  const check = validatePageRange(val, totalPages);
  if (check.valid) {
    selectedPages = new Set(check.pages);
    updateThumbnailsSelection();
    updateSelectedCount();
    if (rangeHelp) rangeHelp.textContent = `${check.pages.length} pages will be extracted`;
  } else {
    if (rangeHelp) rangeHelp.textContent = check.error || 'Invalid range';
  }
});

// File Loader
async function loadFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Please select a valid PDF file.');
    return;
  }

  try {
    currentPdfFile = file;
    sourceArrayBuffer = await file.arrayBuffer();

    const pdfjsDoc = await loadPdfDocument(sourceArrayBuffer);
    totalPages = pdfjsDoc.numPages;

    if (docNameEl) docNameEl.textContent = file.name;
    if (docPagesEl) docPagesEl.textContent = `${totalPages} ${totalPages === 1 ? 'page' : 'pages'}`;
    if (docSizeEl) docSizeEl.textContent = formatBytes(file.size);

    dropzone?.classList.add('hidden');
    controlsContainer?.classList.remove('hidden');
    docSummary?.classList.remove('hidden');

    // Default: select all pages
    selectedPages = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
    updateModeVisibility();
    updateSelectedCount();

    // Render visual thumbnail grid
    renderThumbnails(pdfjsDoc);
  } catch (err: any) {
    console.error('Failed to load PDF for split:', err);
    alert('Failed to read PDF document: ' + (err.message || String(err)));
  }
}

async function renderThumbnails(pdfjsDoc: pdfjsLib.PDFDocumentProxy) {
  if (!pagesGrid) return;
  pagesGrid.innerHTML = '';

  for (let p = 1; p <= totalPages; p++) {
    const card = document.createElement('div');
    card.className =
      'split-page-thumb relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer select-none transition-all hover:shadow-md';
    card.setAttribute('data-page', String(p));

    card.innerHTML = `
      <div class="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
        <canvas id="split-thumb-canvas-${p}" class="w-full h-full object-contain"></canvas>
        <div class="absolute top-1.5 left-1.5">
          <input type="checkbox" data-checkbox-page="${p}" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" checked />
        </div>
        <span class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-bold">
          ${p}
        </span>
      </div>
    `;

    pagesGrid.appendChild(card);

    // Lazy/async render of thumbnail
    renderPageToCanvas(pdfjsDoc, p, 0.4).then((rendered) => {
      const canvasEl = document.getElementById(`split-thumb-canvas-${p}`) as HTMLCanvasElement;
      if (canvasEl) {
        canvasEl.width = rendered.width;
        canvasEl.height = rendered.height;
        const ctx = canvasEl.getContext('2d');
        ctx?.drawImage(rendered.canvas, 0, 0);
      }
    });
  }

  updateThumbnailsSelection();
}

function updateThumbnailsSelection() {
  if (!pagesGrid) return;
  const cards = pagesGrid.querySelectorAll('.split-page-thumb');
  cards.forEach((card) => {
    const p = parseInt(card.getAttribute('data-page') || '0', 10);
    const cb = card.querySelector(`input[data-checkbox-page="${p}"]`) as HTMLInputElement;
    const isSelected = selectedPages.has(p);

    if (cb) cb.checked = isSelected;
    if (isSelected) {
      card.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/40', 'dark:bg-blue-950/20');
      card.classList.remove('opacity-60');
    } else {
      card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/40', 'dark:bg-blue-950/20');
      card.classList.add('opacity-60');
    }
  });
}

// Page thumbnail click toggle
pagesGrid?.addEventListener('click', (e) => {
  const card = (e.target as HTMLElement).closest('.split-page-thumb') as HTMLElement;
  if (!card) return;

  const page = parseInt(card.getAttribute('data-page') || '0', 10);
  if (page <= 0) return;

  if (selectedPages.has(page)) {
    selectedPages.delete(page);
  } else {
    selectedPages.add(page);
  }

  updateThumbnailsSelection();
  updateSelectedCount();

  if (modeExtract?.checked && rangeInput) {
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    rangeInput.value = formatPagesToRanges(sorted);
  }
});

// Quick selection buttons
selectAllBtn?.addEventListener('click', () => {
  selectedPages = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
  updateThumbnailsSelection();
  updateSelectedCount();
  if (modeExtract?.checked && rangeInput) {
    rangeInput.value = `1-${totalPages}`;
  }
});

deselectAllBtn?.addEventListener('click', () => {
  selectedPages.clear();
  updateThumbnailsSelection();
  updateSelectedCount();
  if (modeExtract?.checked && rangeInput) {
    rangeInput.value = '';
  }
});

invertSelectBtn?.addEventListener('click', () => {
  const inverted = new Set<number>();
  for (let i = 1; i <= totalPages; i++) {
    if (!selectedPages.has(i)) inverted.add(i);
  }
  selectedPages = inverted;
  updateThumbnailsSelection();
  updateSelectedCount();
  if (modeExtract?.checked && rangeInput) {
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    rangeInput.value = formatPagesToRanges(sorted);
  }
});

// Dropzone & Inputs
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

resetBtn?.addEventListener('click', () => {
  sourceArrayBuffer = null;
  currentPdfFile = null;
  totalPages = 0;
  selectedPages.clear();
  controlsContainer?.classList.add('hidden');
  dropzone?.classList.remove('hidden');
  if (pagesGrid) pagesGrid.innerHTML = '';
});

// Splitting Execution
splitBtn?.addEventListener('click', async () => {
  if (!sourceArrayBuffer || !currentPdfFile || totalPages === 0) return;

  try {
    splitBtn.disabled = true;
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';
    if (progressText) progressText.textContent = 'Parsing source PDF structure...';

    const sourceDoc = await PDFDocument.load(sourceArrayBuffer);
    const baseName = currentPdfFile.name.replace(/\.pdf$/i, '') || 'document';

    // Mode 1: Extract Selected Pages into 1 single PDF
    if (modeExtract?.checked) {
      const pagesToExtract = Array.from(selectedPages).sort((a, b) => a - b);
      if (pagesToExtract.length === 0) {
        alert('Please select at least 1 page to extract.');
        splitBtn.disabled = false;
        progressContainer?.classList.add('hidden');
        return;
      }

      if (progressBar) progressBar.style.width = '50%';
      if (progressText) progressText.textContent = `Extracting ${pagesToExtract.length} pages...`;

      const newDoc = await PDFDocument.create();
      // 0-based page indices
      const pageIndices = pagesToExtract.map(p => p - 1);
      const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
      copiedPages.forEach(p => newDoc.addPage(p));

      const pdfBytes = await newDoc.save();

      const filename = generateSplitFilename(currentPdfFile.name, pagesToExtract);
      downloadBlob(new Blob([pdfBytes as any], { type: 'application/pdf' }), filename);

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'PDF downloaded successfully!';
    }
    // Mode 2: Split Every Page into Individual PDFs
    else if (modeSingle?.checked) {
      if (progressBar) progressBar.style.width = '20%';
      const zip = new JSZip();

      for (let i = 0; i < totalPages; i++) {
        const percent = Math.round(20 + ((i + 1) / totalPages) * 70);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `Creating page ${i + 1} of ${totalPages}...`;

        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(sourceDoc, [i]);
        singleDoc.addPage(copiedPage);
        const bytes = await singleDoc.save();
        const filename = `${baseName}_page_${i + 1}.pdf`;
        zip.file(filename, bytes);
      }

      if (progressText) progressText.textContent = 'Compressing files into ZIP...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${baseName}_single_pages.zip`);

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'ZIP archive downloaded!';
    }
    // Mode 3: Split by Groups (e.g. "1-2, 3-5, 6-10")
    else if (modeGroups?.checked) {
      const groupsStr = groupsInput?.value.trim() || '';
      const groupTokens = groupsStr.split(';').map(g => g.trim()).filter(Boolean);

      if (groupTokens.length === 0) {
        alert('Please enter range groups separated by semicolons (e.g. 1-2; 3-5; 6-8).');
        splitBtn.disabled = false;
        progressContainer?.classList.add('hidden');
        return;
      }

      const zip = new JSZip();

      for (let gIdx = 0; gIdx < groupTokens.length; gIdx++) {
        const token = groupTokens[gIdx];
        const check = validatePageRange(token, totalPages);
        if (!check.valid || check.pages.length === 0) continue;

        const subDoc = await PDFDocument.create();
        const indices = check.pages.map(p => p - 1);
        const copied = await subDoc.copyPages(sourceDoc, indices);
        copied.forEach(p => subDoc.addPage(p));
        const bytes = await subDoc.save();

        const filename = generateSplitFilename(currentPdfFile.name, check.pages, gIdx, groupTokens.length);
        zip.file(filename, bytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${baseName}_split_groups.zip`);

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Split groups downloaded in ZIP!';
    }
    // Mode 4: Split Every N Pages
    else if (modeEveryN?.checked) {
      const n = parseInt(everyNInput?.value || '2', 10);
      const chunks = chunkPagesEveryN(totalPages, n);

      const zip = new JSZip();

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunkPages = chunks[cIdx];
        const subDoc = await PDFDocument.create();
        const indices = chunkPages.map(p => p - 1);
        const copied = await subDoc.copyPages(sourceDoc, indices);
        copied.forEach(p => subDoc.addPage(p));
        const bytes = await subDoc.save();

        const filename = generateSplitFilename(currentPdfFile.name, chunkPages, cIdx, chunks.length);
        zip.file(filename, bytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${baseName}_every_${n}_pages.zip`);

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = `Downloaded ${chunks.length} parts in ZIP!`;
    }

    setTimeout(() => {
      progressContainer?.classList.add('hidden');
      splitBtn.disabled = false;
    }, 2000);
  } catch (err: any) {
    console.error('PDF splitting error:', err);
    alert('Failed to split PDF: ' + (err.message || String(err)));
    if (progressContainer) progressContainer.classList.add('hidden');
    splitBtn.disabled = false;
  }
});

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
