/**
 * PDF & Docs Preview / Viewer Tool (100% In-Browser)
 * Renders PDFs, Word (.docx), Markdown (.md), and plain text documents
 */
import * as pdfjsLib from 'pdfjs-dist';
import '../utils/pdfWorkerSetup.ts';
import { extractDocxHtml, extractTextFromDocx } from '../utils/docxUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { initSiteShell, showToast } from '../shared/site-shell.ts';
import {
  calculateDocumentStats,
  clampZoom,
  detectDocumentType,
  highlightMatches,
  normalizeRotation,
  parsePageJump,
  type DocumentType,
} from '../utils/pdfDocsUtils.ts';

// State
let currentFile: File | null = null;
let currentDocType: DocumentType = 'other';
let pdfDoc: any = null;
let currentPage = 1;
let totalPages = 1;
let currentZoom = 1.25;
let currentRotation = 0;
let extractedFullText = '';
let textContentLines: string[] = [];
let searchQuery = '';
let searchMatchesCount = 0;
let isRenderingPage = false;
let pageRenderingPending: number | null = null;
let lastArrayBuffer: ArrayBuffer | null = null;

// DOM Elements
const dropzone = document.getElementById('viewer-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('viewer-file-input') as HTMLInputElement | null;
const demoBtn = document.getElementById('viewer-demo-btn') as HTMLButtonElement | null;
const demoDocxBtn = document.getElementById('viewer-demo-docx-btn') as HTMLButtonElement | null;
const workspace = document.getElementById('viewer-workspace') as HTMLElement | null;
const resetBtn = document.getElementById('viewer-reset-btn') as HTMLButtonElement | null;

// Controls
const prevPageBtn = document.getElementById('viewer-prev-page') as HTMLButtonElement | null;
const nextPageBtn = document.getElementById('viewer-next-page') as HTMLButtonElement | null;
const pageInput = document.getElementById('viewer-page-input') as HTMLInputElement | null;
const pageTotalSpan = document.getElementById('viewer-page-total') as HTMLElement | null;

const zoomInBtn = document.getElementById('viewer-zoom-in') as HTMLButtonElement | null;
const zoomOutBtn = document.getElementById('viewer-zoom-out') as HTMLButtonElement | null;
const zoomSelect = document.getElementById('viewer-zoom-select') as HTMLSelectElement | null;
const rotateCwBtn = document.getElementById('viewer-rotate-cw') as HTMLButtonElement | null;
const rotateCcwBtn = document.getElementById('viewer-rotate-ccw') as HTMLButtonElement | null;

const searchInput = document.getElementById('viewer-search-input') as HTMLInputElement | null;
const searchCountBadge = document.getElementById('viewer-search-count') as HTMLElement | null;
const searchPrevBtn = document.getElementById('viewer-search-prev') as HTMLButtonElement | null;
const searchNextBtn = document.getElementById('viewer-search-next') as HTMLButtonElement | null;

const printBtn = document.getElementById('viewer-print-btn') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('viewer-download-btn') as HTMLButtonElement | null;
const openInEditorBtn = document.getElementById('viewer-open-editor-btn') as HTMLButtonElement | null;
const toggleThumbnailsBtn = document.getElementById('viewer-toggle-thumbs') as HTMLButtonElement | null;

// Panels
const thumbnailsSidebar = document.getElementById('viewer-thumbnails-sidebar') as HTMLElement | null;
const thumbnailsList = document.getElementById('viewer-thumbnails-list') as HTMLElement | null;
const pdfCanvasContainer = document.getElementById('viewer-pdf-container') as HTMLElement | null;
const pdfCanvas = document.getElementById('viewer-pdf-canvas') as HTMLCanvasElement | null;
const docxContainer = document.getElementById('viewer-docx-container') as HTMLElement | null;
const docxContent = document.getElementById('viewer-docx-content') as HTMLElement | null;
const textContainer = document.getElementById('viewer-text-container') as HTMLElement | null;
const textContentEl = document.getElementById('viewer-text-content') as HTMLElement | null;

// Stats Badges
const fileNameBadge = document.getElementById('viewer-file-name') as HTMLElement | null;
const fileMetaBadge = document.getElementById('viewer-file-meta') as HTMLElement | null;
const statWords = document.getElementById('viewer-stat-words') as HTMLElement | null;
const statChars = document.getElementById('viewer-stat-chars') as HTMLElement | null;
const statReading = document.getElementById('viewer-stat-reading') as HTMLElement | null;
const statPages = document.getElementById('viewer-stat-pages') as HTMLElement | null;

export function initPdfDocsViewer(): void {
  initSiteShell();
  setupEventListeners();
  checkForTransferredDocument();
}

function setupEventListeners(): void {
  if (!dropzone || !fileInput) return;

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

  demoBtn?.addEventListener('click', loadSamplePdf);
  demoDocxBtn?.addEventListener('click', loadSampleDocument);
  resetBtn?.addEventListener('click', resetViewer);

  // Pagination
  prevPageBtn?.addEventListener('click', () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  });

  nextPageBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  });

  pageInput?.addEventListener('change', () => {
    if (!pageInput) return;
    const target = parsePageJump(pageInput.value, totalPages);
    if (target !== null) {
      goToPage(target);
    } else {
      pageInput.value = String(currentPage);
    }
  });

  // Zooming
  zoomInBtn?.addEventListener('click', () => {
    setZoom(clampZoom(currentZoom + 0.25));
  });

  zoomOutBtn?.addEventListener('click', () => {
    setZoom(clampZoom(currentZoom - 0.25));
  });

  zoomSelect?.addEventListener('change', () => {
    if (!zoomSelect) return;
    const val = parseFloat(zoomSelect.value);
    if (!isNaN(val)) setZoom(val);
  });

  // Rotation
  rotateCwBtn?.addEventListener('click', () => {
    currentRotation = normalizeRotation(currentRotation, 90);
    renderCurrentView();
  });

  rotateCcwBtn?.addEventListener('click', () => {
    currentRotation = normalizeRotation(currentRotation, -90);
    renderCurrentView();
  });

  // Search
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    executeSearch();
  });

  searchPrevBtn?.addEventListener('click', () => navigateSearchResults(-1));
  searchNextBtn?.addEventListener('click', () => navigateSearchResults(1));

  // Sidebar toggle
  toggleThumbnailsBtn?.addEventListener('click', () => {
    thumbnailsSidebar?.classList.toggle('hidden');
  });

  // Print
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  // Download
  downloadBtn?.addEventListener('click', handleDownload);

  // Open in Editor
  openInEditorBtn?.addEventListener('click', handleOpenInEditor);
}

/**
 * Checks if a document was passed via sessionStorage from another tool or editor
 */
function checkForTransferredDocument(): void {
  try {
    const raw = sessionStorage.getItem('toolora_active_document');
    if (raw) {
      sessionStorage.removeItem('toolora_active_document');
      const parsed = JSON.parse(raw);
      if (parsed.filename && parsed.dataUrl) {
        fetch(parsed.dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], parsed.filename, { type: blob.type });
            handleFile(file);
          })
          .catch(() => {});
      }
    }
  } catch (e) {}
}

async function handleFile(file: File): Promise<void> {
  currentFile = file;
  currentDocType = detectDocumentType(file.name, file.type);
  currentPage = 1;
  currentRotation = 0;
  extractedFullText = '';
  searchQuery = '';

  if (dropzone) dropzone.classList.add('hidden');
  if (workspace) workspace.classList.remove('hidden');

  if (fileNameBadge) fileNameBadge.textContent = file.name;
  if (fileMetaBadge) {
    fileMetaBadge.textContent = `${currentDocType.toUpperCase()} \u2022 ${formatBytes(file.size)}`;
  }

  showToast(`Loading ${file.name}...`, 'info');

  try {
    const arrayBuffer = await file.arrayBuffer();
    lastArrayBuffer = arrayBuffer;

    if (currentDocType === 'pdf') {
      await loadPdf(arrayBuffer);
    } else if (currentDocType === 'docx') {
      await loadDocx(arrayBuffer);
    } else {
      await loadPlainText(file);
    }

    updateStats();
    showToast('Document loaded successfully!', 'success');
  } catch (err: any) {
    console.error('Error opening document:', err);
    showToast('Failed to parse document: ' + (err.message || 'Unknown error'), 'error');
    resetViewer();
  }
}

async function loadPdf(arrayBuffer: ArrayBuffer): Promise<void> {
  hideAllContainers();
  if (pdfCanvasContainer) pdfCanvasContainer.classList.remove('hidden');
  if (thumbnailsSidebar) thumbnailsSidebar.classList.remove('hidden');

  pdfDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  }).promise;

  totalPages = pdfDoc.numPages;
  updatePaginationUI();
  await buildThumbnails();
  await renderPdfPage(currentPage);

  // Extract all text in background for search & statistics
  extractPdfTextAsync();
}

async function extractPdfTextAsync(): Promise<void> {
  if (!pdfDoc) return;
  const parts: string[] = [];
  try {
    for (let i = 1; i <= Math.min(totalPages, 50); i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items.map((item: any) => item.str).join(' ');
      parts.push(pageStr);
    }
    extractedFullText = parts.join('\n\n');
    updateStats();
  } catch (e) {
    console.warn('Text extraction partial error:', e);
  }
}

async function renderPdfPage(pageNumber: number): Promise<void> {
  if (!pdfDoc || !pdfCanvas) return;

  if (isRenderingPage) {
    pageRenderingPending = pageNumber;
    return;
  }
  isRenderingPage = true;

  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: currentZoom, rotation: currentRotation });

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    pdfCanvas.width = Math.floor(viewport.width * dpr);
    pdfCanvas.height = Math.floor(viewport.height * dpr);
    pdfCanvas.style.width = `${Math.floor(viewport.width)}px`;
    pdfCanvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = pdfCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    const renderContext = {
      canvasContext: ctx,
      viewport,
    };

    await page.render(renderContext).promise;
    ctx.restore();

    highlightActiveThumbnail(pageNumber);
  } catch (err) {
    console.error('Page render error:', err);
  } finally {
    isRenderingPage = false;
    if (pageRenderingPending !== null) {
      const pending = pageRenderingPending;
      pageRenderingPending = null;
      renderPdfPage(pending);
    }
  }
}

async function buildThumbnails(): Promise<void> {
  if (!thumbnailsList || !pdfDoc) return;
  thumbnailsList.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const thumbItem = document.createElement('button');
    thumbItem.className = `p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col items-center gap-1.5 w-full ${
      i === currentPage
        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/30'
        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
    }`;
    thumbItem.id = `viewer-thumb-${i}`;

    const label = document.createElement('span');
    label.className = 'text-xs font-semibold';
    label.textContent = `Page ${i}`;

    const miniCanvas = document.createElement('canvas');
    miniCanvas.className = 'w-full h-auto rounded-md border border-slate-200 dark:border-slate-800 shadow-xs object-contain';
    miniCanvas.style.maxHeight = '140px';

    thumbItem.appendChild(miniCanvas);
    thumbItem.appendChild(label);

    thumbItem.addEventListener('click', () => {
      goToPage(i);
    });

    thumbnailsList.appendChild(thumbItem);

    // Render thumbnail asynchronously
    pdfDoc.getPage(i).then((page: any) => {
      const viewport = page.getViewport({ scale: 0.25 });
      miniCanvas.width = Math.floor(viewport.width);
      miniCanvas.height = Math.floor(viewport.height);
      const ctx = miniCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);
        page.render({ canvasContext: ctx, viewport });
      }
    });
  }
}

function highlightActiveThumbnail(pageNum: number): void {
  if (!thumbnailsList) return;
  thumbnailsList.querySelectorAll('button').forEach((b, idx) => {
    if (idx + 1 === pageNum) {
      b.className =
        'p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col items-center gap-1.5 w-full border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/30';
      b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      b.className =
        'p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col items-center gap-1.5 w-full border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300';
    }
  });
}

async function loadDocx(arrayBuffer: ArrayBuffer): Promise<void> {
  hideAllContainers();
  if (docxContainer) docxContainer.classList.remove('hidden');
  if (thumbnailsSidebar) thumbnailsSidebar.classList.add('hidden');

  const { html, text } = await extractDocxHtml(arrayBuffer);
  extractedFullText = text;
  totalPages = 1;
  updatePaginationUI();

  if (docxContent) {
    docxContent.innerHTML = html;
  }
}

function renderDocxContent(text: string): void {
  if (!docxContent) return;

  const paragraphs = text.split('\n\n');
  const htmlParts: string[] = [];

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    // Detect heading or paragraph
    if (trimmed.length < 80 && !trimmed.endsWith('.')) {
      htmlParts.push(
        `<h3 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-2 tracking-tight">${escapeHtml(
          trimmed
        )}</h3>`
      );
    } else {
      htmlParts.push(
        `<p class="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-justify">${escapeHtml(
          trimmed
        )}</p>`
      );
    }
  }

  docxContent.innerHTML = htmlParts.join('');
}

async function loadPlainText(file: File): Promise<void> {
  hideAllContainers();
  if (textContainer) textContainer.classList.remove('hidden');
  if (thumbnailsSidebar) thumbnailsSidebar.classList.add('hidden');

  const text = await file.text();
  extractedFullText = text;
  textContentLines = text.split(/\r\n|\r|\n/);
  totalPages = 1;
  updatePaginationUI();

  renderTextContent(text);
}

function renderTextContent(text: string): void {
  if (!textContentEl) return;
  if (searchQuery) {
    const { html, matchCount } = highlightMatches(text, searchQuery);
    searchMatchesCount = matchCount;
    updateSearchBadge();
    textContentEl.innerHTML = html;
  } else {
    textContentEl.textContent = text;
  }
}

function hideAllContainers(): void {
  pdfCanvasContainer?.classList.add('hidden');
  docxContainer?.classList.add('hidden');
  textContainer?.classList.add('hidden');
}

function updatePaginationUI(): void {
  if (pageInput) pageInput.value = String(currentPage);
  if (pageTotalSpan) pageTotalSpan.textContent = String(totalPages);
  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

function goToPage(target: number): void {
  if (target < 1 || target > totalPages) return;
  currentPage = target;
  updatePaginationUI();
  if (currentDocType === 'pdf') {
    renderPdfPage(currentPage);
  }
}

function setZoom(val: number): void {
  currentZoom = clampZoom(val);
  if (zoomSelect) zoomSelect.value = String(currentZoom);

  if (currentDocType === 'pdf') {
    renderPdfPage(currentPage);
  } else if (docxContent) {
    docxContent.style.transform = `scale(${currentZoom})`;
    docxContent.style.transformOrigin = 'top center';
  } else if (textContentEl) {
    textContentEl.style.fontSize = `${Math.round(14 * currentZoom)}px`;
  }
}

function renderCurrentView(): void {
  if (currentDocType === 'pdf') {
    renderPdfPage(currentPage);
  }
}

function executeSearch(): void {
  if (!searchQuery) {
    if (searchCountBadge) searchCountBadge.classList.add('hidden');
    if (currentDocType === 'docx') renderDocxContent(extractedFullText);
    if (currentDocType === 'txt' || currentDocType === 'md') renderTextContent(extractedFullText);
    return;
  }

  if (currentDocType === 'docx' && docxContent) {
    const { html, matchCount } = highlightMatches(extractedFullText, searchQuery);
    docxContent.innerHTML = html;
    searchMatchesCount = matchCount;
    updateSearchBadge();
  } else if ((currentDocType === 'txt' || currentDocType === 'md') && textContentEl) {
    const { html, matchCount } = highlightMatches(extractedFullText, searchQuery);
    textContentEl.innerHTML = html;
    searchMatchesCount = matchCount;
    updateSearchBadge();
  } else if (currentDocType === 'pdf') {
    // Basic occurrence counter for PDF extracted text
    const { matchCount } = highlightMatches(extractedFullText, searchQuery);
    searchMatchesCount = matchCount;
    updateSearchBadge();
  }
}

function updateSearchBadge(): void {
  if (!searchCountBadge) return;
  searchCountBadge.classList.remove('hidden');
  searchCountBadge.textContent = `${searchMatchesCount} ${searchMatchesCount === 1 ? 'match' : 'matches'}`;
}

function navigateSearchResults(delta: number): void {
  const marks = document.querySelectorAll('mark');
  if (marks.length === 0) return;

  let currentIndex = -1;
  marks.forEach((m, idx) => {
    if (m.classList.contains('ring-2')) currentIndex = idx;
  });

  marks.forEach((m) => m.classList.remove('ring-2', 'ring-blue-600'));

  let nextIndex = currentIndex + delta;
  if (nextIndex < 0) nextIndex = marks.length - 1;
  if (nextIndex >= marks.length) nextIndex = 0;

  const target = marks[nextIndex];
  if (target) {
    target.classList.add('ring-2', 'ring-blue-600');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateStats(): void {
  const stats = calculateDocumentStats(extractedFullText);
  if (statWords) statWords.textContent = stats.words.toLocaleString();
  if (statChars) statChars.textContent = stats.chars.toLocaleString();
  if (statReading) statReading.textContent = `${stats.readingTimeMin} min`;
  if (statPages) statPages.textContent = String(totalPages);
}

function handleDownload(): void {
  if (!currentFile) return;
  const url = URL.createObjectURL(currentFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFile.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Download started!', 'success');
}

function handleOpenInEditor(): void {
  if (!currentFile) {
    window.location.href = '/pdf-docs-editor.html';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const dataUrl = reader.result as string;
      sessionStorage.setItem(
        'toolora_active_document',
        JSON.stringify({
          filename: currentFile!.name,
          dataUrl,
        })
      );
      window.location.href = '/pdf-docs-editor.html';
    } catch (e) {
      window.location.href = '/pdf-docs-editor.html';
    }
  };
  reader.readAsDataURL(currentFile);
}

function resetViewer(): void {
  currentFile = null;
  currentDocType = 'other';
  pdfDoc = null;
  currentPage = 1;
  totalPages = 1;
  extractedFullText = '';
  lastArrayBuffer = null;

  hideAllContainers();
  if (workspace) workspace.classList.add('hidden');
  if (dropzone) dropzone.classList.remove('hidden');
  if (thumbnailsList) thumbnailsList.innerHTML = '';
}

/**
 * Loads a rich sample PDF for instant 1-click preview testing
 */
async function loadSamplePdf(): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Overview
  const page1 = doc.addPage([595.28, 841.89]);
  page1.drawText('Sample Document: Toolora PDF & Docs Viewer', {
    x: 50,
    y: 780,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.45),
  });

  page1.drawText('100% In-Browser Privacy, Document Inspection & Fast Reading', {
    x: 50,
    y: 750,
    size: 12,
    font,
    color: rgb(0.3, 0.35, 0.4),
  });

  page1.drawText(
    'This sample document demonstrates the client-side viewer capabilities of Toolora.\n' +
      'Files are rendered and parsed strictly inside your local browser sandbox.\n' +
      'No data is uploaded to remote servers or third-party storage providers.',
    {
      x: 50,
      y: 700,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.15),
      lineHeight: 18,
    }
  );

  page1.drawText('Key Features Supported:', {
    x: 50,
    y: 620,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  const bullets = [
    '• High-DPI page rendering with PDF.js canvas',
    '• Interactive page thumbnail sidebar with instant jumping',
    '• Multi-format support: PDF, Microsoft Word (.docx), and Text (.txt, .md)',
    '• In-document keyword search with highlighted matches',
    '• Responsive zoom (fit-width, 50% - 200%) and 90-degree page rotation',
    '• Direct handoff to the PDF & Docs Editor with 1 click',
  ];

  let bulletY = 590;
  for (const b of bullets) {
    page1.drawText(b, { x: 60, y: bulletY, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
    bulletY -= 24;
  }

  // Page 2: Analytics & Summary
  const page2 = doc.addPage([595.28, 841.89]);
  page2.drawText('Page 2: Document Analytics & Summary', {
    x: 50,
    y: 780,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.45),
  });

  page2.drawText(
    'Inspect document statistics in real time including word count, character count,\n' +
      'estimated reading time, and page totals. Ready to annotate or sign? Click "Open in Editor".',
    {
      x: 50,
      y: 740,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 18,
    }
  );

  const pdfBytes = await doc.save();
  const file = new File([pdfBytes as any], 'sample-document.pdf', { type: 'application/pdf' });
  handleFile(file);
}

/**
 * Loads a sample Word / Markdown document
 */
function loadSampleDocument(): void {
  const content = `# Project Proposal: Modern Web Document Processing Suite

## Executive Summary
This document outlines the architecture for an end-to-end, client-side document reading and editing platform. Built with modern WebAssembly and Web Standards, the system processes documents entirely within the user's browser sandbox.

## Key Objectives
1. **Zero Server Uploads**: Safeguard customer privacy by maintaining 100% of data processing on client devices.
2. **Universal Format Compatibility**: Smoothly parse and render PDFs, Word documents (.docx), and plain text.
3. **High-Fidelity Interaction**: Provide responsive page navigation, sharp HiDPI zooming, and search capabilities.
4. **Collaborative Workflow**: Allow instant switching between Preview and Full Editor modes.

## Security & Compliance
By eliminating server-side file uploads, the application inherently satisfies GDPR, HIPAA, and CCPA data sovereignty considerations. Confidential files never touch a network socket.

## Next Steps
Use the top toolbar to zoom, rotate, search for keywords, or click "Open in Editor" to annotate and edit!`;

  const file = new File([content], 'project-proposal.md', { type: 'text/markdown' });
  handleFile(file);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdfDocsViewer);
  } else {
    initPdfDocsViewer();
  }
}
