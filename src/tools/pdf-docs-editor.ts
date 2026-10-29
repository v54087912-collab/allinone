/**
 * PDF & Docs Editor Tool (100% In-Browser)
 * Dual-mode editor:
 * 1. Visual PDF Annotator (Draw, Highlight, Text, Shapes, Signature, Stamps, Page Reordering)
 * 2. Word & Rich Doc Editor (WYSIWYG, DOCX Export, PDF Export, Plain Text Export)
 */
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import '../utils/pdfWorkerSetup.ts';
import { createDocxZip, extractTextFromDocx, type PageTextContent } from '../utils/docxUtils.ts';
import { convertParagraphsToPdf } from '../utils/wordToPdfUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { initSiteShell, showToast } from '../shared/site-shell.ts';
import {
  calculateDocumentStats,
  clampZoom,
  detectDocumentType,
  normalizeRotation,
  type DocumentType,
} from '../utils/pdfDocsUtils.ts';

// Annotation types
export type ToolType = 'select' | 'pen' | 'highlighter' | 'text' | 'rect' | 'circle' | 'signature' | 'whiteout';

interface AnnotationItem {
  type: ToolType;
  color: string;
  size: number;
  opacity: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// State
let activeTab: 'pdf' | 'doc' = 'pdf';
let currentFile: File | null = null;
let pdfDocProxy: any = null;
let pdfBytes: Uint8Array | null = null;
let currentPage = 1;
let totalPages = 1;
let pageRotations: number[] = [];
let currentZoom = 1.0;

// Annotation state per page (page number 1-indexed -> array of annotations)
const pageAnnotations: Map<number, AnnotationItem[]> = new Map();
const undoHistory: Map<number, AnnotationItem[][]> = new Map();

let currentTool: ToolType = 'pen';
let currentColor = '#ef4444'; // Red default
let currentStrokeSize = 3;
let currentOpacity = 1.0;
let isDrawing = false;
let currentPath: Array<{ x: number; y: number }> = [];
let shapeStartX = 0;
let shapeStartY = 0;

// Signature state
let signatureDataUrl: string | null = null;

// DOM Elements - Navigation & Modes
const tabPdfBtn = document.getElementById('editor-tab-pdf') as HTMLButtonElement | null;
const tabDocBtn = document.getElementById('editor-tab-doc') as HTMLButtonElement | null;
const pdfEditorSection = document.getElementById('editor-pdf-section') as HTMLElement | null;
const docEditorSection = document.getElementById('editor-doc-section') as HTMLElement | null;

// PDF Editor DOM Elements
const pdfDropzone = document.getElementById('editor-pdf-dropzone') as HTMLElement | null;
const pdfFileInput = document.getElementById('editor-pdf-file-input') as HTMLInputElement | null;
const pdfWorkspace = document.getElementById('editor-pdf-workspace') as HTMLElement | null;
const pdfNewBlankBtn = document.getElementById('editor-new-blank-pdf') as HTMLButtonElement | null;
const pdfDemoBtn = document.getElementById('editor-demo-pdf-btn') as HTMLButtonElement | null;

// PDF Canvases
const pdfBaseCanvas = document.getElementById('editor-pdf-base-canvas') as HTMLCanvasElement | null;
const pdfDrawCanvas = document.getElementById('editor-pdf-draw-canvas') as HTMLCanvasElement | null;
const canvasWrapper = document.getElementById('editor-canvas-wrapper') as HTMLElement | null;

// PDF Controls
const prevPageBtn = document.getElementById('editor-prev-page') as HTMLButtonElement | null;
const nextPageBtn = document.getElementById('editor-next-page') as HTMLButtonElement | null;
const pageInput = document.getElementById('editor-page-input') as HTMLInputElement | null;
const pageTotalSpan = document.getElementById('editor-page-total') as HTMLElement | null;

const rotatePageBtn = document.getElementById('editor-rotate-page') as HTMLButtonElement | null;
const duplicatePageBtn = document.getElementById('editor-duplicate-page') as HTMLButtonElement | null;
const deletePageBtn = document.getElementById('editor-delete-page') as HTMLButtonElement | null;
const addBlankPageBtn = document.getElementById('editor-add-blank-page') as HTMLButtonElement | null;

const undoBtn = document.getElementById('editor-undo-btn') as HTMLButtonElement | null;
const clearPageBtn = document.getElementById('editor-clear-page-btn') as HTMLButtonElement | null;
const exportPdfBtn = document.getElementById('editor-export-pdf-btn') as HTMLButtonElement | null;
const previewInViewerBtn = document.getElementById('editor-preview-viewer-btn') as HTMLButtonElement | null;

// PDF Tool Buttons
const toolButtons = document.querySelectorAll<HTMLButtonElement>('[data-editor-tool]');
const colorPicker = document.getElementById('editor-color-picker') as HTMLInputElement | null;
const sizeSlider = document.getElementById('editor-size-slider') as HTMLInputElement | null;
const sizeDisplay = document.getElementById('editor-size-display') as HTMLElement | null;

// Signature Modal
const signatureModal = document.getElementById('editor-sig-modal') as HTMLElement | null;
const openSigModalBtn = document.getElementById('editor-open-sig-modal') as HTMLButtonElement | null;
const closeSigModalBtn = document.getElementById('editor-close-sig-modal') as HTMLButtonElement | null;
const sigCanvas = document.getElementById('editor-sig-canvas') as HTMLCanvasElement | null;
const clearSigBtn = document.getElementById('editor-clear-sig-btn') as HTMLButtonElement | null;
const applySigBtn = document.getElementById('editor-apply-sig-btn') as HTMLButtonElement | null;

// Doc Editor DOM Elements
const docDropzone = document.getElementById('editor-doc-dropzone') as HTMLElement | null;
const docFileInput = document.getElementById('editor-doc-file-input') as HTMLInputElement | null;
const docContent = document.getElementById('editor-doc-content') as HTMLElement | null;
const docWordCount = document.getElementById('editor-doc-word-count') as HTMLElement | null;
const docCharCount = document.getElementById('editor-doc-char-count') as HTMLElement | null;
const docDemoBtn = document.getElementById('editor-doc-demo-btn') as HTMLButtonElement | null;
const docNewBlankBtn = document.getElementById('editor-doc-new-blank') as HTMLButtonElement | null;

// Doc Export
const exportDocxBtn = document.getElementById('editor-export-docx-btn') as HTMLButtonElement | null;
const exportDocPdfBtn = document.getElementById('editor-export-doc-pdf-btn') as HTMLButtonElement | null;
const exportTxtBtn = document.getElementById('editor-export-txt-btn') as HTMLButtonElement | null;

export function initPdfDocsEditor(): void {
  initSiteShell();
  setupTabSwitching();
  setupPdfEditor();
  setupDocEditor();
  setupSignaturePad();
  checkForTransferredDocument();
}

function setupTabSwitching(): void {
  tabPdfBtn?.addEventListener('click', () => switchTab('pdf'));
  tabDocBtn?.addEventListener('click', () => switchTab('doc'));
}

function switchTab(tab: 'pdf' | 'doc'): void {
  activeTab = tab;
  if (tab === 'pdf') {
    tabPdfBtn?.classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
    tabPdfBtn?.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700');
    tabDocBtn?.classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
    tabDocBtn?.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700');
    pdfEditorSection?.classList.remove('hidden');
    docEditorSection?.classList.add('hidden');
  } else {
    tabDocBtn?.classList.add('border-blue-600', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
    tabDocBtn?.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700');
    tabPdfBtn?.classList.remove('border-blue-600', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
    tabPdfBtn?.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700');
    docEditorSection?.classList.remove('hidden');
    pdfEditorSection?.classList.add('hidden');
  }
}

/**
 * Checks if a document was passed via sessionStorage
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
            const docType = detectDocumentType(file.name, file.type);
            if (docType === 'docx' || docType === 'txt' || docType === 'md') {
              switchTab('doc');
              handleDocFile(file);
            } else {
              switchTab('pdf');
              handlePdfFile(file);
            }
          })
          .catch(() => {});
      }
    }
  } catch (e) {}
}

// -------------------------------------------------------------
// PDF VISUAL ANNOTATOR LOGIC
// -------------------------------------------------------------
function setupPdfEditor(): void {
  if (!pdfDropzone || !pdfFileInput) return;

  pdfDropzone.addEventListener('click', () => pdfFileInput.click());
  pdfFileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handlePdfFile(file);
    pdfFileInput.value = '';
  });

  pdfDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    pdfDropzone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  pdfDropzone.addEventListener('dragleave', () => {
    pdfDropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  pdfDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    pdfDropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
    const file = e.dataTransfer?.files?.[0];
    if (file) handlePdfFile(file);
  });

  pdfNewBlankBtn?.addEventListener('click', createBlankPdf);
  pdfDemoBtn?.addEventListener('click', loadDemoPdf);

  // Pagination
  prevPageBtn?.addEventListener('click', () => {
    if (currentPage > 1) goToPdfPage(currentPage - 1);
  });
  nextPageBtn?.addEventListener('click', () => {
    if (currentPage < totalPages) goToPdfPage(currentPage + 1);
  });
  pageInput?.addEventListener('change', () => {
    if (!pageInput) return;
    const num = parseInt(pageInput.value, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      goToPdfPage(num);
    } else {
      pageInput.value = String(currentPage);
    }
  });

  // Page Operations
  rotatePageBtn?.addEventListener('click', () => {
    pageRotations[currentPage - 1] = normalizeRotation(pageRotations[currentPage - 1] || 0, 90);
    renderPdfActivePage();
    showToast(`Page ${currentPage} rotated 90°`, 'info');
  });

  duplicatePageBtn?.addEventListener('click', handleDuplicatePage);
  deletePageBtn?.addEventListener('click', handleDeletePage);
  addBlankPageBtn?.addEventListener('click', handleAddBlankPage);

  // Tools Selection
  toolButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      toolButtons.forEach((b) => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      });
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');

      currentTool = (btn.getAttribute('data-editor-tool') || 'pen') as ToolType;
      if (currentTool === 'highlighter') {
        currentOpacity = 0.4;
      } else {
        currentOpacity = 1.0;
      }
    });
  });

  colorPicker?.addEventListener('input', () => {
    currentColor = colorPicker.value;
  });

  sizeSlider?.addEventListener('input', () => {
    if (!sizeSlider) return;
    currentStrokeSize = parseInt(sizeSlider.value, 10) || 3;
    if (sizeDisplay) sizeDisplay.textContent = `${currentStrokeSize}px`;
  });

  // Undo / Clear
  undoBtn?.addEventListener('click', handleUndo);
  clearPageBtn?.addEventListener('click', handleClearPage);

  // Export
  exportPdfBtn?.addEventListener('click', handleExportPdf);
  previewInViewerBtn?.addEventListener('click', handlePreviewInViewer);

  // Drawing canvas events
  setupDrawingCanvas();
}

async function handlePdfFile(file: File): Promise<void> {
  currentFile = file;
  try {
    showToast(`Loading ${file.name}...`, 'info');
    const buffer = await file.arrayBuffer();
    pdfBytes = new Uint8Array(buffer);
    await loadPdfFromBytes(pdfBytes);
    showToast('PDF loaded into editor!', 'success');
  } catch (err: any) {
    console.error('PDF Load Error:', err);
    showToast('Failed to load PDF: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function loadPdfFromBytes(bytes: Uint8Array): Promise<void> {
  pdfBytes = bytes;
  pdfDocProxy = await pdfjsLib.getDocument({
    data: bytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  }).promise;

  totalPages = pdfDocProxy.numPages;
  pageRotations = new Array(totalPages).fill(0);
  pageAnnotations.clear();
  undoHistory.clear();
  currentPage = 1;

  if (pdfDropzone) pdfDropzone.classList.add('hidden');
  if (pdfWorkspace) pdfWorkspace.classList.remove('hidden');

  updatePageControls();
  await renderPdfActivePage();
}

function updatePageControls(): void {
  if (pageInput) pageInput.value = String(currentPage);
  if (pageTotalSpan) pageTotalSpan.textContent = String(totalPages);
  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  if (deletePageBtn) deletePageBtn.disabled = totalPages <= 1;
}

async function goToPdfPage(page: number): Promise<void> {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  updatePageControls();
  await renderPdfActivePage();
}

async function renderPdfActivePage(): Promise<void> {
  if (!pdfDocProxy || !pdfBaseCanvas || !pdfDrawCanvas) return;

  const page = await pdfDocProxy.getPage(currentPage);
  const rot = pageRotations[currentPage - 1] || 0;
  const viewport = page.getViewport({ scale: currentZoom, rotation: rot });

  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(viewport.width);
  const h = Math.floor(viewport.height);

  // Resize both canvases
  [pdfBaseCanvas, pdfDrawCanvas].forEach((canvas) => {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  });

  const baseCtx = pdfBaseCanvas.getContext('2d');
  if (baseCtx) {
    baseCtx.save();
    baseCtx.scale(dpr, dpr);
    baseCtx.fillStyle = '#ffffff';
    baseCtx.fillRect(0, 0, w, h);

    await page.render({
      canvasContext: baseCtx,
      viewport,
    }).promise;
    baseCtx.restore();
  }

  // Render annotations for this page
  redrawDrawCanvas();
}

function setupDrawingCanvas(): void {
  if (!pdfDrawCanvas) return;

  const getCanvasPos = (e: MouseEvent | TouchEvent) => {
    const rect = pdfDrawCanvas!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (e: MouseEvent | TouchEvent) => {
    if (currentTool === 'select') return;
    const pos = getCanvasPos(e);
    isDrawing = true;
    shapeStartX = pos.x;
    shapeStartY = pos.y;
    currentPath = [pos];

    if (currentTool === 'text') {
      const text = prompt('Enter annotation text:');
      if (text && text.trim()) {
        saveAnnotationToCurrentPage({
          type: 'text',
          color: currentColor,
          size: currentStrokeSize * 5, // Font size proportional to stroke size
          opacity: currentOpacity,
          text: text.trim(),
          x: pos.x,
          y: pos.y,
        });
      }
      isDrawing = false;
      return;
    }

    if (currentTool === 'signature' && signatureDataUrl) {
      saveAnnotationToCurrentPage({
        type: 'signature',
        color: currentColor,
        size: currentStrokeSize,
        opacity: 1.0,
        text: signatureDataUrl,
        x: pos.x,
        y: pos.y,
        width: 140,
        height: 60,
      });
      isDrawing = false;
      return;
    }
  };

  const moveDraw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    const pos = getCanvasPos(e);

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      currentPath.push(pos);
      redrawDrawCanvas();
      drawSingleStroke(currentPath, currentColor, currentStrokeSize, currentOpacity);
    } else if (currentTool === 'rect' || currentTool === 'circle' || currentTool === 'whiteout') {
      redrawDrawCanvas();
      drawPreviewShape(shapeStartX, shapeStartY, pos.x, pos.y, currentTool);
    }
  };

  const endDraw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      if (currentPath.length > 1) {
        saveAnnotationToCurrentPage({
          type: currentTool,
          color: currentColor,
          size: currentStrokeSize,
          opacity: currentOpacity,
          points: [...currentPath],
        });
      }
    } else if (currentTool === 'rect' || currentTool === 'circle' || currentTool === 'whiteout') {
      const pos = getCanvasPos(e as any);
      saveAnnotationToCurrentPage({
        type: currentTool,
        color: currentTool === 'whiteout' ? '#ffffff' : currentColor,
        size: currentStrokeSize,
        opacity: 1.0,
        x: Math.min(shapeStartX, pos.x),
        y: Math.min(shapeStartY, pos.y),
        width: Math.abs(pos.x - shapeStartX),
        height: Math.abs(pos.y - shapeStartY),
      });
    }

    currentPath = [];
  };

  pdfDrawCanvas.addEventListener('mousedown', startDraw);
  pdfDrawCanvas.addEventListener('mousemove', moveDraw);
  window.addEventListener('mouseup', endDraw);

  pdfDrawCanvas.addEventListener('touchstart', startDraw, { passive: false });
  pdfDrawCanvas.addEventListener('touchmove', moveDraw, { passive: false });
  window.addEventListener('touchend', endDraw);
}

function saveAnnotationToCurrentPage(item: AnnotationItem): void {
  const currentList = pageAnnotations.get(currentPage) || [];
  // Push undo snapshot
  const history = undoHistory.get(currentPage) || [];
  history.push([...currentList]);
  undoHistory.set(currentPage, history);

  currentList.push(item);
  pageAnnotations.set(currentPage, currentList);
  redrawDrawCanvas();
}

function redrawDrawCanvas(): void {
  if (!pdfDrawCanvas) return;
  const ctx = pdfDrawCanvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, pdfDrawCanvas.width, pdfDrawCanvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  const annotations = pageAnnotations.get(currentPage) || [];
  for (const ann of annotations) {
    ctx.save();
    ctx.globalAlpha = ann.opacity;

    if (ann.type === 'pen' || ann.type === 'highlighter') {
      if (ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.type === 'highlighter' ? ann.size * 3 : ann.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }
    } else if (ann.type === 'rect') {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.size;
      ctx.strokeRect(ann.x || 0, ann.y || 0, ann.width || 0, ann.height || 0);
    } else if (ann.type === 'circle') {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.size;
      const rx = (ann.width || 0) / 2;
      const ry = (ann.height || 0) / 2;
      ctx.beginPath();
      ctx.ellipse((ann.x || 0) + rx, (ann.y || 0) + ry, Math.max(1, rx), Math.max(1, ry), 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (ann.type === 'whiteout') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ann.x || 0, ann.y || 0, ann.width || 0, ann.height || 0);
    } else if (ann.type === 'text') {
      ctx.fillStyle = ann.color;
      ctx.font = `bold ${ann.size}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(ann.text || '', ann.x || 0, ann.y || 0);
    } else if (ann.type === 'signature' && ann.text) {
      const img = new Image();
      img.src = ann.text;
      ctx.drawImage(img, ann.x || 0, ann.y || 0, ann.width || 140, ann.height || 60);
    }

    ctx.restore();
  }

  ctx.restore();
}

function drawSingleStroke(
  points: Array<{ x: number; y: number }>,
  color: string,
  size: number,
  opacity: number
): void {
  if (!pdfDrawCanvas || points.length < 2) return;
  const ctx = pdfDrawCanvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = currentTool === 'highlighter' ? size * 3 : size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

function drawPreviewShape(x1: number, y1: number, x2: number, y2: number, tool: ToolType): void {
  if (!pdfDrawCanvas) return;
  const ctx = pdfDrawCanvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  if (tool === 'rect') {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStrokeSize;
    ctx.strokeRect(left, top, w, h);
  } else if (tool === 'circle') {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStrokeSize;
    ctx.beginPath();
    ctx.ellipse(left + w / 2, top + h / 2, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, 2 * Math.PI);
    ctx.stroke();
  } else if (tool === 'whiteout') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(left, top, w, h);
  }

  ctx.restore();
}

function handleUndo(): void {
  const history = undoHistory.get(currentPage) || [];
  if (history.length > 0) {
    const previous = history.pop()!;
    undoHistory.set(currentPage, history);
    pageAnnotations.set(currentPage, previous);
    redrawDrawCanvas();
    showToast('Undo successful', 'info');
  } else {
    showToast('No more actions to undo on this page', 'info');
  }
}

function handleClearPage(): void {
  if (confirm('Clear all annotations on this page?')) {
    saveAnnotationToCurrentPage({ type: 'select', color: '', size: 0, opacity: 0 }); // record for undo
    pageAnnotations.set(currentPage, []);
    redrawDrawCanvas();
    showToast('Page annotations cleared', 'info');
  }
}

async function handleDuplicatePage(): Promise<void> {
  if (!pdfBytes) return;
  try {
    const doc = await PDFDocument.load(pdfBytes);
    const [copied] = await doc.copyPages(doc, [currentPage - 1]);
    doc.insertPage(currentPage, copied);

    const newBytes = await doc.save();
    await loadPdfFromBytes(newBytes);
    showToast(`Page ${currentPage} duplicated!`, 'success');
  } catch (e: any) {
    showToast('Failed to duplicate page: ' + e.message, 'error');
  }
}

async function handleDeletePage(): Promise<void> {
  if (!pdfBytes || totalPages <= 1) {
    showToast('Cannot delete the only page in the document', 'warning');
    return;
  }
  if (!confirm(`Delete page ${currentPage}? This cannot be undone.`)) return;

  try {
    const doc = await PDFDocument.load(pdfBytes);
    doc.removePage(currentPage - 1);
    const newBytes = await doc.save();
    await loadPdfFromBytes(newBytes);
    showToast(`Page removed`, 'success');
  } catch (e: any) {
    showToast('Failed to delete page: ' + e.message, 'error');
  }
}

async function handleAddBlankPage(): Promise<void> {
  if (!pdfBytes) return;
  try {
    const doc = await PDFDocument.load(pdfBytes);
    doc.insertPage(currentPage, [595.28, 841.89]); // Standard A4
    const newBytes = await doc.save();
    await loadPdfFromBytes(newBytes);
    showToast(`Blank page inserted after page ${currentPage}`, 'success');
  } catch (e: any) {
    showToast('Failed to add blank page: ' + e.message, 'error');
  }
}

/**
 * Merges the PDF document with all layer annotations and downloads the new file
 */
async function handleExportPdf(): Promise<void> {
  if (!pdfBytes) return;
  showToast('Preparing edited PDF for download...', 'info');

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Render each page with its annotations
    for (let pNum = 1; pNum <= totalPages; pNum++) {
      const annotations = pageAnnotations.get(pNum);
      const rot = pageRotations[pNum - 1] || 0;
      const pdfPage = pdfDoc.getPage(pNum - 1);

      // Apply page rotation if changed
      if (rot !== 0) {
        pdfPage.setRotation({ type: 'degrees', angle: (pdfPage.getRotation().angle + rot) % 360 } as any);
      }

      // If page has annotations, render overlay canvas to PNG and embed
      if (annotations && annotations.length > 0) {
        const offCanvas = document.createElement('canvas');
        const { width: pW, height: pH } = pdfPage.getSize();
        offCanvas.width = Math.round(pW * 2);
        offCanvas.height = Math.round(pH * 2);
        const offCtx = offCanvas.getContext('2d');

        if (offCtx) {
          offCtx.scale(2, 2);

          for (const ann of annotations) {
            offCtx.save();
            offCtx.globalAlpha = ann.opacity;

            if (ann.type === 'pen' || ann.type === 'highlighter') {
              if (ann.points && ann.points.length > 1) {
                offCtx.strokeStyle = ann.color;
                offCtx.lineWidth = ann.type === 'highlighter' ? ann.size * 3 : ann.size;
                offCtx.lineCap = 'round';
                offCtx.lineJoin = 'round';
                offCtx.beginPath();
                offCtx.moveTo(ann.points[0].x, ann.points[0].y);
                for (let i = 1; i < ann.points.length; i++) {
                  offCtx.lineTo(ann.points[i].x, ann.points[i].y);
                }
                offCtx.stroke();
              }
            } else if (ann.type === 'rect') {
              offCtx.strokeStyle = ann.color;
              offCtx.lineWidth = ann.size;
              offCtx.strokeRect(ann.x || 0, ann.y || 0, ann.width || 0, ann.height || 0);
            } else if (ann.type === 'circle') {
              offCtx.strokeStyle = ann.color;
              offCtx.lineWidth = ann.size;
              const rx = (ann.width || 0) / 2;
              const ry = (ann.height || 0) / 2;
              offCtx.beginPath();
              offCtx.ellipse((ann.x || 0) + rx, (ann.y || 0) + ry, rx, ry, 0, 0, 2 * Math.PI);
              offCtx.stroke();
            } else if (ann.type === 'whiteout') {
              offCtx.fillStyle = '#ffffff';
              offCtx.fillRect(ann.x || 0, ann.y || 0, ann.width || 0, ann.height || 0);
            } else if (ann.type === 'text') {
              offCtx.fillStyle = ann.color;
              offCtx.font = `bold ${ann.size}px sans-serif`;
              offCtx.textBaseline = 'top';
              offCtx.fillText(ann.text || '', ann.x || 0, ann.y || 0);
            } else if (ann.type === 'signature' && ann.text) {
              const img = new Image();
              img.src = ann.text;
              offCtx.drawImage(img, ann.x || 0, ann.y || 0, ann.width || 140, ann.height || 60);
            }

            offCtx.restore();
          }

          const pngDataUrl = offCanvas.toDataURL('image/png');
          const pngBytes = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
          const embeddedImage = await pdfDoc.embedPng(pngBytes);
          pdfPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pW,
            height: pH,
          });
        }
      }
    }

    const modifiedBytes = await pdfDoc.save();
    const blob = new Blob([modifiedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile ? `edited-${currentFile.name}` : 'edited-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Edited PDF downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Export PDF error:', err);
    showToast('Failed to export PDF: ' + err.message, 'error');
  }
}

function handlePreviewInViewer(): void {
  if (!pdfBytes) return;
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const reader = new FileReader();
  reader.onload = () => {
    try {
      sessionStorage.setItem(
        'toolora_active_document',
        JSON.stringify({
          filename: currentFile ? currentFile.name : 'edited-document.pdf',
          dataUrl: reader.result as string,
        })
      );
      window.location.href = '/pdf-docs-viewer.html';
    } catch (e) {
      window.location.href = '/pdf-docs-viewer.html';
    }
  };
  reader.readAsDataURL(blob);
}

async function createBlankPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  doc.addPage([595.28, 841.89]);
  const bytes = await doc.save();
  currentFile = new File([bytes as any], 'new-document.pdf', { type: 'application/pdf' });
  await loadPdfFromBytes(bytes);
  showToast('New blank PDF created! Start annotating.', 'success');
}

async function loadDemoPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const bytes = await doc.save();
  currentFile = new File([bytes as any], 'contract-sample.pdf', { type: 'application/pdf' });
  await loadPdfFromBytes(bytes);

  // Add demo sample annotations
  pageAnnotations.set(1, [
    {
      type: 'text',
      color: '#1e293b',
      size: 22,
      opacity: 1,
      text: 'CONFIDENTIAL NON-DISCLOSURE AGREEMENT',
      x: 60,
      y: 60,
    },
    {
      type: 'rect',
      color: '#2563eb',
      size: 2,
      opacity: 1,
      x: 55,
      y: 110,
      width: 480,
      height: 80,
    },
    {
      type: 'text',
      color: '#475569',
      size: 13,
      opacity: 1,
      text: 'This agreement protects proprietary research and software trade secrets.',
      x: 70,
      y: 135,
    },
    {
      type: 'highlighter',
      color: '#facc15',
      size: 14,
      opacity: 0.4,
      points: [
        { x: 70, y: 142 },
        { x: 380, y: 142 },
      ],
    },
  ]);

  redrawDrawCanvas();
  showToast('Demo document loaded with sample annotations!', 'success');
}

// -------------------------------------------------------------
// SIGNATURE PAD MODAL
// -------------------------------------------------------------
function setupSignaturePad(): void {
  if (!sigCanvas || !signatureModal) return;
  const ctx = sigCanvas.getContext('2d');
  let isSigDrawing = false;

  openSigModalBtn?.addEventListener('click', () => {
    signatureModal.classList.remove('hidden');
    if (ctx) {
      ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
  });

  closeSigModalBtn?.addEventListener('click', () => {
    signatureModal.classList.add('hidden');
  });

  clearSigBtn?.addEventListener('click', () => {
    if (ctx) {
      ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
  });

  const getPos = (e: MouseEvent | TouchEvent) => {
    const rect = sigCanvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: x - rect.left, y: y - rect.top };
  };

  sigCanvas.addEventListener('mousedown', (e) => {
    isSigDrawing = true;
    const p = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  });

  sigCanvas.addEventListener('mousemove', (e) => {
    if (!isSigDrawing || !ctx) return;
    const p = getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });

  window.addEventListener('mouseup', () => {
    isSigDrawing = false;
  });

  applySigBtn?.addEventListener('click', () => {
    signatureDataUrl = sigCanvas.toDataURL('image/png');
    signatureModal.classList.add('hidden');
    currentTool = 'signature';
    showToast('Signature ready! Click anywhere on the PDF page to place it.', 'success');
  });
}

// -------------------------------------------------------------
// DOC & RICH TEXT EDITOR LOGIC
// -------------------------------------------------------------
function setupDocEditor(): void {
  if (!docDropzone || !docFileInput || !docContent) return;

  docDropzone.addEventListener('click', () => docFileInput.click());
  docFileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleDocFile(file);
    docFileInput.value = '';
  });

  docDemoBtn?.addEventListener('click', loadDemoDocText);
  docNewBlankBtn?.addEventListener('click', () => {
    if (docContent) {
      docContent.innerHTML = '<h2>New Document Title</h2><p>Start typing your document here...</p>';
      updateDocStats();
      showToast('New blank document created', 'info');
    }
  });

  // Formatting toolbar
  document.querySelectorAll<HTMLButtonElement>('[data-doc-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-doc-cmd');
      const val = btn.getAttribute('data-doc-val') || '';
      if (cmd) {
        document.execCommand(cmd, false, val);
        docContent.focus();
        updateDocStats();
      }
    });
  });

  docContent.addEventListener('input', () => {
    updateDocStats();
  });

  exportDocxBtn?.addEventListener('click', handleExportDocx);
  exportDocPdfBtn?.addEventListener('click', handleExportDocPdf);
  exportTxtBtn?.addEventListener('click', handleExportTxt);
}

async function handleDocFile(file: File): Promise<void> {
  currentFile = file;
  const docType = detectDocumentType(file.name, file.type);
  showToast(`Opening ${file.name}...`, 'info');

  try {
    if (docType === 'docx') {
      const buffer = await file.arrayBuffer();
      const text = await extractTextFromDocx(buffer);
      if (docContent) {
        const paragraphs = text.split('\n\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('');
        docContent.innerHTML = paragraphs;
      }
    } else {
      const text = await file.text();
      if (docContent) {
        const paragraphs = text.split('\n\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('');
        docContent.innerHTML = paragraphs;
      }
    }

    if (docDropzone) docDropzone.classList.add('hidden');
    updateDocStats();
    showToast('Document opened in editor!', 'success');
  } catch (err: any) {
    console.error('Doc read error:', err);
    showToast('Failed to open document: ' + err.message, 'error');
  }
}

function updateDocStats(): void {
  if (!docContent) return;
  const text = docContent.innerText || '';
  const stats = calculateDocumentStats(text);
  if (docWordCount) docWordCount.textContent = `${stats.words} words`;
  if (docCharCount) docCharCount.textContent = `${stats.chars} characters`;
}

async function handleExportDocx(): Promise<void> {
  if (!docContent) return;
  const rawText = docContent.innerText || '';
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const page: PageTextContent = {
    pageNumber: 1,
    paragraphs: lines.map((text, i) => ({
      text,
      isHeading: i === 0 || text.length < 50 && !text.endsWith('.'),
    })),
  };

  showToast('Generating Microsoft Word (.docx)...', 'info');
  const zipBytes = await createDocxZip([page]);
  const blob = new Blob([zipBytes as any], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFile ? `${currentFile.name.replace(/\.[^/.]+$/, '')}.docx` : 'document.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Word document downloaded!', 'success');
}

async function handleExportDocPdf(): Promise<void> {
  if (!docContent) return;
  const rawText = docContent.innerText || '';
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  showToast('Converting text to PDF...', 'info');
  const pdfBytes = await convertParagraphsToPdf(
    lines.map((text, i) => ({
      text,
      isHeading: i === 0 || (text.length < 50 && !text.endsWith('.')),
    }))
  );

  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFile ? `${currentFile.name.replace(/\.[^/.]+$/, '')}.pdf` : 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('PDF document downloaded!', 'success');
}

function handleExportTxt(): void {
  if (!docContent) return;
  const text = docContent.innerText || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFile ? `${currentFile.name.replace(/\.[^/.]+$/, '')}.txt` : 'document.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Text file downloaded!', 'success');
}

function loadDemoDocText(): void {
  if (!docContent) return;
  docContent.innerHTML = `
    <h2>Project Master Services Agreement</h2>
    <p>This Master Services Agreement is entered into by and between the Client and the Service Provider to govern all digital deliverable requirements.</p>
    <h3>1. Scope of Services</h3>
    <p>The Service Provider shall deliver client-side web application modules engineered with performance, accessibility, and zero-upload security principles.</p>
    <h3>2. Privacy & Data Integrity</h3>
    <p>All data transformation, rendering, and export procedures execute strictly within client memory. No confidential data leaves the host environment.</p>
    <h3>3. Deliverables and Acceptance</h3>
    <p>The deliverables include tested software artifacts, comprehensive documentation, and browser-native styling conforming to modern responsive standards.</p>
  `;
  updateDocStats();
  if (docDropzone) docDropzone.classList.add('hidden');
  showToast('Demo document loaded into editor', 'info');
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
    document.addEventListener('DOMContentLoaded', initPdfDocsEditor);
  } else {
    initPdfDocsEditor();
  }
}
