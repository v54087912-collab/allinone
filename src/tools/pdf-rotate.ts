/**
 * PDF Rotate Tool (100% In-Browser)
 * Allows rotating individual pages or all pages with live preview grid.
 */
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { applyPageRotations, normalizeRotation } from '../utils/pdfRotateUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

import '../utils/pdfWorkerSetup.ts';

let loadedPdfBytes: Uint8Array | null = null;
let originalFileName = 'document.pdf';
let totalPages = 0;
// Maps 0-indexed page number -> absolute rotation degrees (0, 90, 180, 270)
const pageRotations = new Map<number, number>();

// DOM Elements
const dropzone = document.getElementById('rotate-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('rotate-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('rotate-workspace') as HTMLElement | null;
const pagesGrid = document.getElementById('rotate-pages-grid') as HTMLElement | null;
const metaBadge = document.getElementById('rotate-meta-badge') as HTMLElement | null;
const rotateAllRightBtn = document.getElementById('rotate-all-right-btn') as HTMLButtonElement | null;
const rotateAllLeftBtn = document.getElementById('rotate-all-left-btn') as HTMLButtonElement | null;
const resetRotationsBtn = document.getElementById('rotate-reset-btn') as HTMLButtonElement | null;
const changeFileBtn = document.getElementById('rotate-change-file-btn') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('rotate-download-btn') as HTMLButtonElement | null;

export function initRotateTool(): void {
  if (!dropzone || !fileInput || !workspace || !pagesGrid) return;

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

  rotateAllRightBtn?.addEventListener('click', () => batchRotate(90));
  rotateAllLeftBtn?.addEventListener('click', () => batchRotate(-90));
  resetRotationsBtn?.addEventListener('click', resetAllRotations);

  changeFileBtn?.addEventListener('click', () => {
    loadedPdfBytes = null;
    pageRotations.clear();
    pagesGrid.innerHTML = '';
    workspace.classList.add('hidden');
    dropzone.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);
}

async function handleFile(file: File) {
  try {
    originalFileName = file.name;
    const buf = await file.arrayBuffer();
    loadedPdfBytes = new Uint8Array(buf);
    pageRotations.clear();

    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    const pdfJsDoc = await pdfjsLib.getDocument({ data: loadedPdfBytes }).promise;
    totalPages = pdfJsDoc.numPages;

    if (metaBadge) {
      metaBadge.textContent = `${originalFileName} (${totalPages} ${totalPages === 1 ? 'page' : 'pages'} \u2022 ${formatBytes(file.size)})`;
    }

    if (pagesGrid) {
      pagesGrid.innerHTML = '';
    }

    // Render cards for each page
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfJsDoc.getPage(i);
      const initialRotation = page.rotate || 0;
      pageRotations.set(i - 1, initialRotation);

      const card = createPageCard(i, page, initialRotation);
      pagesGrid?.appendChild(card);
    }

    showToast(`Loaded ${totalPages} pages. Adjust rotation as needed.`, 'success');
  } catch (err: any) {
    showToast('Failed to load PDF: ' + err.message, 'error');
  }
}

function createPageCard(pageNum: number, page: any, initialAngle: number): HTMLElement {
  const card = document.createElement('div');
  card.className =
    'bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2.5 shadow-sm transition-all hover:shadow-md';
  card.id = `page-card-${pageNum}`;

  // Canvas preview container
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'w-full h-44 flex items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800';

  const canvas = document.createElement('canvas');
  canvas.id = `page-canvas-${pageNum}`;
  canvas.className = 'max-h-40 max-w-[90%] transition-transform duration-300 ease-in-out';
  canvasWrap.appendChild(canvas);

  // Render thumbnail
  const viewport = page.getViewport({ scale: 0.5 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    });
  }

  // Header: Page label + current angle badge
  const metaRow = document.createElement('div');
  metaRow.className = 'w-full flex items-center justify-between text-xs font-semibold px-1 text-slate-700 dark:text-slate-300';
  
  const pageLabel = document.createElement('span');
  pageLabel.textContent = `Page ${pageNum}`;

  const angleBadge = document.createElement('span');
  angleBadge.id = `badge-angle-${pageNum}`;
  angleBadge.className = 'font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
  angleBadge.textContent = `${initialAngle}°`;

  metaRow.appendChild(pageLabel);
  metaRow.appendChild(angleBadge);

  // Buttons: Rotate Left & Rotate Right
  const actionRow = document.createElement('div');
  actionRow.className = 'flex items-center gap-2 w-full pt-1';

  const rotLeftBtn = document.createElement('button');
  rotLeftBtn.type = 'button';
  rotLeftBtn.className =
    'flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1';
  rotLeftBtn.innerHTML = `
    <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
    </svg>
    <span>-90°</span>
  `;
  rotLeftBtn.addEventListener('click', () => rotateSinglePage(pageNum, -90));

  const rotRightBtn = document.createElement('button');
  rotRightBtn.type = 'button';
  rotRightBtn.className =
    'flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1';
  rotRightBtn.innerHTML = `
    <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"/>
    </svg>
    <span>+90°</span>
  `;
  rotRightBtn.addEventListener('click', () => rotateSinglePage(pageNum, 90));

  actionRow.appendChild(rotLeftBtn);
  actionRow.appendChild(rotRightBtn);

  card.appendChild(metaRow);
  card.appendChild(canvasWrap);
  card.appendChild(actionRow);

  return card;
}

function rotateSinglePage(pageNum: number, deltaAngle: number) {
  const pageIdx = pageNum - 1;
  const currentAngle = pageRotations.get(pageIdx) || 0;
  const newAngle = normalizeRotation(currentAngle + deltaAngle);
  pageRotations.set(pageIdx, newAngle);

  // Update canvas style and angle badge
  updatePageCardVisuals(pageNum, newAngle);
}

function batchRotate(deltaAngle: number) {
  for (let i = 1; i <= totalPages; i++) {
    const pageIdx = i - 1;
    const currentAngle = pageRotations.get(pageIdx) || 0;
    const newAngle = normalizeRotation(currentAngle + deltaAngle);
    pageRotations.set(pageIdx, newAngle);
    updatePageCardVisuals(i, newAngle);
  }
  showToast(`Rotated all pages by ${deltaAngle > 0 ? '+' : ''}${deltaAngle}°`, 'info');
}

function resetAllRotations() {
  for (let i = 1; i <= totalPages; i++) {
    const pageIdx = i - 1;
    pageRotations.set(pageIdx, 0);
    updatePageCardVisuals(i, 0);
  }
  showToast('Reset all pages to 0°', 'info');
}

function updatePageCardVisuals(pageNum: number, angle: number) {
  const canvas = document.getElementById(`page-canvas-${pageNum}`) as HTMLCanvasElement | null;
  const badge = document.getElementById(`badge-angle-${pageNum}`) as HTMLElement | null;

  if (canvas) {
    canvas.style.transform = `rotate(${angle}deg)`;
  }
  if (badge) {
    badge.textContent = `${angle}°`;
    if (angle !== 0) {
      badge.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
      badge.classList.add('bg-blue-100', 'dark:bg-blue-900/60', 'text-blue-700', 'dark:text-blue-300');
    } else {
      badge.classList.remove('bg-blue-100', 'dark:bg-blue-900/60', 'text-blue-700', 'dark:text-blue-300');
      badge.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
    }
  }
}

async function handleDownload() {
  if (!loadedPdfBytes) return;

  try {
    if (downloadBtn) downloadBtn.disabled = true;
    showToast('Applying rotations to PDF...', 'info');

    const pdfDoc = await PDFDocument.load(loadedPdfBytes);
    applyPageRotations(pdfDoc, pageRotations);

    const outputBytes = await pdfDoc.save();
    const blob = new Blob([outputBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_rotated.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Rotated PDF downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Rotate error:', err);
    showToast('Failed to rotate PDF: ' + err.message, 'error');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRotateTool);
} else {
  initRotateTool();
}
