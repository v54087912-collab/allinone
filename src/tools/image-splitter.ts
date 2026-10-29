/**
 * Image Splitter & Grid Slicer Tool (100% In-Browser)
 */
import JSZip from 'jszip';
import {
  calculateGridSlices,
  calculateFixedTileSlices,
  generateSliceFilename,
  type ImageSliceRect,
} from '../utils/splitterUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let baseImage: HTMLImageElement | null = null;
let originalFile: File | null = null;

let splitMode: 'grid' | 'tile' = 'grid';
let rows = 3;
let cols = 3;
let tileWidth = 64;
let tileHeight = 64;

let calculatedSlices: ImageSliceRect[] = [];

// DOM Elements
const dropzone = document.getElementById('split-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('split-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('split-workspace') as HTMLElement | null;
const canvas = document.getElementById('split-canvas') as HTMLCanvasElement | null;
const demoBtn = document.getElementById('split-demo-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('split-reset-btn') as HTMLButtonElement | null;
const downloadZipBtn = document.getElementById('split-download-zip-btn') as HTMLButtonElement | null;
const formatSelect = document.getElementById('split-format-select') as HTMLSelectElement | null;
const imageMetaBadge = document.getElementById('split-image-meta') as HTMLElement | null;
const piecesBadge = document.getElementById('split-pieces-badge') as HTMLElement | null;
const galleryContainer = document.getElementById('split-gallery') as HTMLElement | null;

// Controls
const splitModeRadios = document.querySelectorAll<HTMLInputElement>('input[name="split-mode"]');
const gridControls = document.getElementById('split-grid-controls') as HTMLElement | null;
const tileControls = document.getElementById('split-tile-controls') as HTMLElement | null;
const rowsInput = document.getElementById('split-rows') as HTMLInputElement | null;
const colsInput = document.getElementById('split-cols') as HTMLInputElement | null;
const tileWInput = document.getElementById('split-tile-w') as HTMLInputElement | null;
const tileHInput = document.getElementById('split-tile-h') as HTMLInputElement | null;
const presetButtons = document.querySelectorAll<HTMLButtonElement>('[data-preset]');

export function initSplitterTool(): void {
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

  demoBtn?.addEventListener('click', loadDemoPanorama);

  // Split Mode toggle
  splitModeRadios.forEach((r) => {
    r.addEventListener('change', () => {
      splitMode = (r.value as 'grid' | 'tile') || 'grid';
      if (splitMode === 'grid') {
        gridControls?.classList.remove('hidden');
        tileControls?.classList.add('hidden');
      } else {
        gridControls?.classList.add('hidden');
        tileControls?.classList.remove('hidden');
      }
      updateSlices();
    });
  });

  // Grid rows & cols
  rowsInput?.addEventListener('input', () => {
    rows = Math.max(1, Math.min(20, parseInt(rowsInput.value, 10) || 1));
    updateSlices();
  });

  colsInput?.addEventListener('input', () => {
    cols = Math.max(1, Math.min(20, parseInt(colsInput.value, 10) || 1));
    updateSlices();
  });

  // Tile dimensions
  tileWInput?.addEventListener('input', () => {
    tileWidth = Math.max(8, parseInt(tileWInput.value, 10) || 64);
    updateSlices();
  });

  tileHInput?.addEventListener('input', () => {
    tileHeight = Math.max(8, parseInt(tileHInput.value, 10) || 64);
    updateSlices();
  });

  // Preset buttons (e.g. 3x3 for IG, 3x1 for carousel)
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if (preset === '3x3') {
        rows = 3;
        cols = 3;
      } else if (preset === '3x1') {
        rows = 1;
        cols = 3;
      } else if (preset === '2x2') {
        rows = 2;
        cols = 2;
      } else if (preset === '1x3') {
        rows = 3;
        cols = 1;
      }
      if (rowsInput) rowsInput.value = String(rows);
      if (colsInput) colsInput.value = String(cols);
      updateSlices();
    });
  });

  resetBtn?.addEventListener('click', () => {
    baseImage = null;
    originalFile = null;
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadZipBtn?.addEventListener('click', handleDownloadZip);
}

function loadImage(file: File) {
  originalFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    baseImage = img;
    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    if (imageMetaBadge) {
      imageMetaBadge.textContent = `${img.naturalWidth} \u00D7 ${img.naturalHeight} px \u2022 ${formatBytes(file.size)}`;
    }

    updateSlices();
    showToast('Image loaded! Select your slice configuration.', 'success');
  };
  img.src = url;
}

function loadDemoPanorama() {
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 1800;
  demoCanvas.height = 600;
  const ctx = demoCanvas.getContext('2d');
  if (!ctx) return;

  // Scenic 3:1 panorama
  const grad = ctx.createLinearGradient(0, 0, 1800, 0);
  grad.addColorStop(0, '#06b6d4');
  grad.addColorStop(0.5, '#3b82f6');
  grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1800, 600);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('QUICKPIC STUDIO 3-POST CAROUSEL BANNER', 320, 320);

  demoCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'demo_panorama.png', { type: 'image/png' });
      // Default to 1 row x 3 cols for carousel demo
      rows = 1;
      cols = 3;
      if (rowsInput) rowsInput.value = '1';
      if (colsInput) colsInput.value = '3';
      loadImage(file);
    }
  });
}

function updateSlices() {
  if (!baseImage) return;

  const w = baseImage.naturalWidth;
  const h = baseImage.naturalHeight;

  if (splitMode === 'grid') {
    calculatedSlices = calculateGridSlices(w, h, rows, cols);
  } else {
    calculatedSlices = calculateFixedTileSlices(w, h, tileWidth, tileHeight);
  }

  if (piecesBadge) {
    piecesBadge.textContent = `${calculatedSlices.length} ${calculatedSlices.length === 1 ? 'slice' : 'slices'}`;
  }

  renderCanvas();
  renderGallery();
}

function renderCanvas() {
  if (!canvas || !baseImage) return;

  const w = baseImage.naturalWidth;
  const h = baseImage.naturalHeight;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw base photo
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(baseImage, 0, 0);

  // 2. Draw slice overlay grid & labels
  ctx.save();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(w / 600));

  calculatedSlices.forEach((slice) => {
    // Grid slice border
    ctx.strokeRect(slice.x, slice.y, slice.width, slice.height);

    // Number tag badge
    const badgeW = Math.max(32, Math.min(80, Math.round(slice.width * 0.22)));
    const badgeH = Math.max(22, Math.min(36, Math.round(slice.height * 0.15)));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(slice.x + 8, slice.y + 8, badgeW, badgeH);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(badgeH * 0.6)}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(`#${slice.index + 1}`, slice.x + 8 + badgeW / 2, slice.y + 8 + badgeH / 2);
  });

  ctx.restore();
}

function renderGallery() {
  if (!galleryContainer || !baseImage) return;
  galleryContainer.innerHTML = '';

  const format = (formatSelect?.value || 'image/png') as 'image/png' | 'image/jpeg' | 'image/webp';
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';

  calculatedSlices.forEach((slice) => {
    // Render individual slice thumbnail
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = slice.width;
    thumbCanvas.height = slice.height;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(
        baseImage!,
        slice.x,
        slice.y,
        slice.width,
        slice.height,
        0,
        0,
        slice.width,
        slice.height
      );
    }

    const card = document.createElement('div');
    card.className =
      'p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between text-xs space-y-2 group hover:shadow-md transition-all';

    card.innerHTML = `
      <div class="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <img src="${thumbCanvas.toDataURL(format, 0.85)}" alt="Slice ${slice.index + 1}" class="max-w-full max-h-full object-contain" />
        <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-white font-mono font-bold text-[10px]">
          #${slice.index + 1}
        </span>
      </div>
      <div>
        <div class="font-medium text-slate-800 dark:text-slate-200 truncate">Part ${slice.index + 1}</div>
        <div class="text-[11px] text-slate-500">${slice.width} &times; ${slice.height} px</div>
      </div>
      <button type="button" class="w-full py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 font-semibold text-xs transition-colors cursor-pointer" data-action="download-slice" data-idx="${slice.index}">
        Download Slice
      </button>
    `;

    card.querySelector('[data-action="download-slice"]')?.addEventListener('click', () => {
      thumbCanvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const sliceName = generateSliceFilename(
            originalFile?.name || 'slice',
            slice.row,
            slice.col,
            slice.index,
            ext
          );
          a.download = sliceName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        },
        format,
        0.95
      );
    });

    galleryContainer.appendChild(card);
  });
}

async function handleDownloadZip() {
  if (!baseImage || calculatedSlices.length === 0) return;

  try {
    if (downloadZipBtn) downloadZipBtn.disabled = true;
    showToast(`Generating ZIP with ${calculatedSlices.length} slices...`, 'info');

    const zip = new JSZip();
    const format = (formatSelect?.value || 'image/png') as 'image/png' | 'image/jpeg' | 'image/webp';
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'slices';

    for (const slice of calculatedSlices) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = slice.width;
      sliceCanvas.height = slice.height;
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(
        baseImage,
        slice.x,
        slice.y,
        slice.width,
        slice.height,
        0,
        0,
        slice.width,
        slice.height
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        sliceCanvas.toBlob(resolve, format, 0.95)
      );

      if (blob) {
        const sliceFilename = generateSliceFilename(
          baseName,
          slice.row,
          slice.col,
          slice.index,
          ext
        );
        zip.file(sliceFilename, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_split_pieces.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('All image slices downloaded as ZIP!', 'success');
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    showToast('Failed to create ZIP: ' + err.message, 'error');
  } finally {
    if (downloadZipBtn) downloadZipBtn.disabled = false;
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSplitterTool);
} else {
  initSplitterTool();
}
