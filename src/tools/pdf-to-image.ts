import JSZip from 'jszip';
import { loadPdfDocument, renderPageToCanvas, type RenderedPdfPage } from '../utils/pdfRenderer.ts';
import { validatePageRange } from '../utils/pdfUtils.ts';
import type * as pdfjsLib from 'pdfjs-dist';

interface PageOutput {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  filename: string;
}

let currentPdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
let currentPdfFile: File | null = null;
let renderedPages: PageOutput[] = [];

// DOM Elements
const fileInput = document.getElementById('pdf2img-file-input') as HTMLInputElement;
const dropzone = document.getElementById('pdf2img-dropzone') as HTMLElement;
const controlsContainer = document.getElementById('pdf2img-controls-container') as HTMLElement;
const docSummary = document.getElementById('pdf2img-doc-summary') as HTMLElement;
const docNameEl = document.getElementById('pdf2img-doc-name') as HTMLElement;
const docPagesEl = document.getElementById('pdf2img-doc-pages') as HTMLElement;
const docSizeEl = document.getElementById('pdf2img-doc-size') as HTMLElement;

// Options
const formatSelect = document.getElementById('pdf2img-format') as HTMLSelectElement;
const scaleSelect = document.getElementById('pdf2img-scale') as HTMLSelectElement;
const rangeRadioAll = document.getElementById('pdf2img-range-all') as HTMLInputElement;
const rangeRadioCustom = document.getElementById('pdf2img-range-custom') as HTMLInputElement;
const rangeInput = document.getElementById('pdf2img-range-input') as HTMLInputElement;
const rangeError = document.getElementById('pdf2img-range-error') as HTMLElement;

// Action Buttons
const convertBtn = document.getElementById('pdf2img-convert-btn') as HTMLButtonElement;
const resetBtn = document.getElementById('pdf2img-reset-btn') as HTMLButtonElement;
const downloadZipBtn = document.getElementById('pdf2img-download-zip') as HTMLButtonElement;
const progressContainer = document.getElementById('pdf2img-progress-container') as HTMLElement;
const progressBar = document.getElementById('pdf2img-progress-bar') as HTMLElement;
const progressText = document.getElementById('pdf2img-progress-text') as HTMLElement;

// Gallery
const galleryContainer = document.getElementById('pdf2img-gallery-container') as HTMLElement;
const galleryGrid = document.getElementById('pdf2img-gallery-grid') as HTMLElement;
const galleryCount = document.getElementById('pdf2img-gallery-count') as HTMLElement;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(1) + ' MB';
}

// Range input radio toggle
rangeRadioAll?.addEventListener('change', () => {
  if (rangeInput) rangeInput.disabled = true;
  if (rangeError) rangeError.textContent = '';
});

rangeRadioCustom?.addEventListener('change', () => {
  if (rangeInput) {
    rangeInput.disabled = false;
    rangeInput.focus();
  }
});

rangeInput?.addEventListener('input', () => {
  if (!currentPdfDoc) return;
  const val = rangeInput.value.trim();
  const check = validatePageRange(val, currentPdfDoc.numPages);
  if (rangeError) {
    rangeError.textContent = check.valid ? '' : (check.error || 'Invalid range');
  }
});

// Dropzone & File loading
async function loadFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('Please select a valid PDF file.');
    return;
  }

  try {
    currentPdfFile = file;
    const arrayBuffer = await file.arrayBuffer();
    currentPdfDoc = await loadPdfDocument(arrayBuffer);

    // Update summary
    if (docNameEl) docNameEl.textContent = file.name;
    if (docPagesEl) docPagesEl.textContent = `${currentPdfDoc.numPages} ${currentPdfDoc.numPages === 1 ? 'page' : 'pages'}`;
    if (docSizeEl) docSizeEl.textContent = formatBytes(file.size);

    dropzone?.classList.add('hidden');
    controlsContainer?.classList.remove('hidden');
    if (docSummary) docSummary.classList.remove('hidden');

    // Reset gallery
    renderedPages = [];
    galleryContainer?.classList.add('hidden');
    if (galleryGrid) galleryGrid.innerHTML = '';
  } catch (err: any) {
    console.error('Failed to parse PDF:', err);
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

resetBtn?.addEventListener('click', () => {
  currentPdfDoc = null;
  currentPdfFile = null;
  renderedPages = [];
  controlsContainer?.classList.add('hidden');
  galleryContainer?.classList.add('hidden');
  dropzone?.classList.remove('hidden');
});

// Conversion Process
convertBtn?.addEventListener('click', async () => {
  if (!currentPdfDoc || !currentPdfFile) return;

  const totalPages = currentPdfDoc.numPages;
  let targetPages: number[] = [];

  if (rangeRadioCustom?.checked) {
    const check = validatePageRange(rangeInput?.value || '', totalPages);
    if (!check.valid || check.pages.length === 0) {
      alert(check.error || 'Please enter a valid page range.');
      rangeInput?.focus();
      return;
    }
    targetPages = check.pages;
  } else {
    targetPages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const format = (formatSelect?.value || 'png') as 'png' | 'jpeg';
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const scale = parseFloat(scaleSelect?.value || '1.5');
  const baseName = currentPdfFile.name.replace(/\.pdf$/i, '') || 'document';

  try {
    convertBtn.disabled = true;
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';

    renderedPages = [];
    if (galleryGrid) galleryGrid.innerHTML = '';

    const totalToRender = targetPages.length;

    for (let i = 0; i < totalToRender; i++) {
      const pageNum = targetPages[i];
      const percent = Math.round(((i + 1) / totalToRender) * 100);

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `Rendering page ${pageNum} (${i + 1} of ${totalToRender})...`;

      const rendered: RenderedPdfPage = await renderPageToCanvas(currentPdfDoc, pageNum, scale);

      // Convert to blob with chosen format
      const blob = await new Promise<Blob>((resolve) => {
        rendered.canvas.toBlob(
          (b) => resolve(b || new Blob()),
          mimeType,
          format === 'jpeg' ? 0.92 : undefined
        );
      });

      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const filename = `${baseName}_page_${pageNum}.${ext}`;
      const dataUrl = rendered.canvas.toDataURL(mimeType, format === 'jpeg' ? 0.92 : undefined);

      const pageOutput: PageOutput = {
        pageNumber: pageNum,
        dataUrl,
        blob,
        width: rendered.width,
        height: rendered.height,
        filename,
      };

      renderedPages.push(pageOutput);
      renderPageCard(pageOutput);
    }

    if (galleryCount) galleryCount.textContent = `${renderedPages.length} ${renderedPages.length === 1 ? 'page' : 'pages'} extracted`;
    galleryContainer?.classList.remove('hidden');

    if (progressText) progressText.textContent = `Completed! ${renderedPages.length} pages converted.`;
    setTimeout(() => {
      progressContainer?.classList.add('hidden');
      convertBtn.disabled = false;
    }, 1500);
  } catch (err: any) {
    console.error('PDF to Image conversion error:', err);
    alert('Conversion failed: ' + (err.message || String(err)));
    if (progressContainer) progressContainer.classList.add('hidden');
    convertBtn.disabled = false;
  }
});

function renderPageCard(page: PageOutput) {
  if (!galleryGrid) return;

  const card = document.createElement('div');
  card.className =
    'p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3';

  card.innerHTML = `
    <div class="relative rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 aspect-[3/4] flex items-center justify-center">
      <img src="${page.dataUrl}" alt="Page ${page.pageNumber}" class="w-full h-full object-contain" />
      <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px] font-bold">
        Page ${page.pageNumber}
      </span>
    </div>
    <div class="space-y-2">
      <div class="text-[11px] text-slate-500 flex items-center justify-between">
        <span>${page.width} &times; ${page.height} px</span>
        <span>${formatBytes(page.blob.size)}</span>
      </div>
      <button
        type="button"
        data-download-idx="${renderedPages.length - 1}"
        class="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        <span>Download</span>
      </button>
    </div>
  `;

  galleryGrid.appendChild(card);
}

// Single image download click
galleryGrid?.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('button');
  if (!target) return;

  const idx = parseInt(target.getAttribute('data-download-idx') || '-1', 10);
  if (idx < 0 || idx >= renderedPages.length) return;

  const page = renderedPages[idx];
  const url = URL.createObjectURL(page.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = page.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

// Download All as ZIP
downloadZipBtn?.addEventListener('click', async () => {
  if (renderedPages.length === 0) return;

  try {
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = 'Packaging ZIP...';

    const zip = new JSZip();
    renderedPages.forEach((page) => {
      zip.file(page.filename, page.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    const base = currentPdfFile?.name.replace(/\.pdf$/i, '') || 'document';
    a.download = `${base}_images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    downloadZipBtn.disabled = false;
    downloadZipBtn.textContent = 'Download All as ZIP';
  } catch (err: any) {
    console.error('ZIP package error:', err);
    alert('Failed to package ZIP: ' + (err.message || String(err)));
    downloadZipBtn.disabled = false;
    downloadZipBtn.textContent = 'Download All as ZIP';
  }
});
