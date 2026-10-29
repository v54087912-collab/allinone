/**
 * Image Merger / Photo Stitcher Tool (100% In-Browser)
 */
import {
  calculateMergedLayout,
  ImageDimension,
  MergeAlignment,
  MergeDirection,
} from '../utils/mergerUtils';
import { formatBytes } from '../utils/image-math';
import { showToast } from '../shared/site-shell';

interface MergedImageItem {
  id: string;
  file: File;
  name: string;
  element: HTMLImageElement;
  width: number;
  height: number;
  url: string;
}

let images: MergedImageItem[] = [];
let direction: MergeDirection = 'vertical';
let alignment: MergeAlignment = 'center';
let spacing = 12;
let gridColumns = 2;
let matchDimensions = true;
let backgroundColor = '#ffffff';

export function initMergerTool(): void {
  const dropzone = document.getElementById('merge-dropzone');
  const fileInput = document.getElementById('merge-file-input') as HTMLInputElement;
  const demoBtn = document.getElementById('merge-demo-btn');
  const addMoreBtn = document.getElementById('merge-add-more-btn');
  const clearBtn = document.getElementById('merge-clear-btn');
  const spacingSlider = document.getElementById('merge-spacing-slider') as HTMLInputElement;
  const spacingVal = document.getElementById('merge-spacing-val');
  const matchDimsCheck = document.getElementById('merge-match-dims') as HTMLInputElement;
  const bgColorPicker = document.getElementById('merge-bg-color') as HTMLInputElement;
  const gridColsContainer = document.getElementById('merge-grid-cols-container');
  const gridColsInput = document.getElementById('merge-grid-cols') as HTMLInputElement;
  const downloadBtn = document.getElementById('merge-download-btn');
  const exportFormatSelect = document.getElementById('merge-format-select') as HTMLSelectElement;

  if (!dropzone || !fileInput) return;

  // File loading
  dropzone.addEventListener('click', () => fileInput.click());
  addMoreBtn?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) handleFiles(Array.from(files));
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50/20');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/20');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/20');
    if (e.dataTransfer?.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  demoBtn?.addEventListener('click', () => loadDemoImages());
  clearBtn?.addEventListener('click', () => clearAll());

  // Direction mode tabs
  document.querySelectorAll('[data-merge-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-merge-dir]').forEach((b) => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      });
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');

      direction = btn.getAttribute('data-merge-dir') as MergeDirection;
      if (gridColsContainer) {
        gridColsContainer.style.display = direction === 'grid' ? 'flex' : 'none';
      }
      renderMergedPreview();
    });
  });

  // Controls
  spacingSlider?.addEventListener('input', () => {
    spacing = parseInt(spacingSlider.value, 10);
    if (spacingVal) spacingVal.textContent = `${spacing}px`;
    renderMergedPreview();
  });

  gridColsInput?.addEventListener('input', () => {
    gridColumns = Math.max(1, parseInt(gridColsInput.value, 10) || 2);
    renderMergedPreview();
  });

  matchDimsCheck?.addEventListener('change', () => {
    matchDimensions = matchDimsCheck.checked;
    renderMergedPreview();
  });

  bgColorPicker?.addEventListener('input', () => {
    backgroundColor = bgColorPicker.value;
    renderMergedPreview();
  });

  downloadBtn?.addEventListener('click', () => {
    const format = exportFormatSelect ? exportFormatSelect.value : 'image/png';
    downloadMergedImage(format);
  });
}

async function handleFiles(files: File[]): Promise<void> {
  const validFiles = files.filter((f) => f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    showToast('Please select valid image files.', 'error');
    return;
  }

  for (const file of validFiles) {
    const url = URL.createObjectURL(file);
    const img = new Image();

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });

    images.push({
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      file,
      name: file.name,
      element: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      url,
    });
  }

  updateImageList();
  renderMergedPreview();
  showToast(`Added ${validFiles.length} image(s)`, 'success');
}

function updateImageList(): void {
  const emptyState = document.getElementById('merge-empty-state');
  const activeState = document.getElementById('merge-active-state');
  const list = document.getElementById('merge-order-list');
  const countBadge = document.getElementById('merge-count-badge');

  if (images.length === 0) {
    emptyState?.classList.remove('hidden');
    activeState?.classList.add('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  activeState?.classList.remove('hidden');

  if (countBadge) countBadge.textContent = `${images.length} images`;

  if (!list) return;
  list.innerHTML = '';

  images.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className =
      'p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-2xs';

    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
          ${idx + 1}
        </span>
        <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <img src="${item.url}" alt="${item.name}" class="max-w-full max-h-full object-contain" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-[160px]" title="${item.name}">
            ${item.name}
          </div>
          <div class="text-[10px] text-slate-500 font-mono">
            ${item.width}×${item.height}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" data-move-up="${item.id}" class="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Move Up" ${idx === 0 ? 'disabled class="opacity-30"' : ''}>
          &uarr;
        </button>
        <button type="button" data-move-down="${item.id}" class="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Move Down" ${idx === images.length - 1 ? 'disabled class="opacity-30"' : ''}>
          &darr;
        </button>
        <button type="button" data-remove="${item.id}" class="p-1 text-slate-400 hover:text-rose-500 cursor-pointer" title="Remove">
          &times;
        </button>
      </div>
    `;

    row.querySelector(`[data-move-up="${item.id}"]`)?.addEventListener('click', () => moveImage(idx, -1));
    row.querySelector(`[data-move-down="${item.id}"]`)?.addEventListener('click', () => moveImage(idx, 1));
    row.querySelector(`[data-remove="${item.id}"]`)?.addEventListener('click', () => removeImage(item.id));

    list.appendChild(row);
  });
}

function moveImage(index: number, delta: number): void {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= images.length) return;
  const temp = images[index];
  images[index] = images[newIndex];
  images[newIndex] = temp;
  updateImageList();
  renderMergedPreview();
}

function removeImage(id: string): void {
  const item = images.find((i) => i.id === id);
  if (item) URL.revokeObjectURL(item.url);
  images = images.filter((i) => i.id !== id);
  updateImageList();
  renderMergedPreview();
}

function clearAll(): void {
  images.forEach((i) => URL.revokeObjectURL(i.url));
  images = [];
  updateImageList();
  renderMergedPreview();
}

function renderMergedPreview(): void {
  const canvas = document.getElementById('merge-canvas') as HTMLCanvasElement;
  const dimsBadge = document.getElementById('merge-dims-badge');
  if (!canvas) return;

  if (images.length === 0) {
    canvas.width = 1;
    canvas.height = 1;
    if (dimsBadge) dimsBadge.textContent = '0 × 0 px';
    return;
  }

  const dims: ImageDimension[] = images.map((img) => ({
    id: img.id,
    width: img.width,
    height: img.height,
  }));

  const layout = calculateMergedLayout(dims, {
    direction,
    spacing,
    gridColumns,
    alignment,
    matchDimensions,
  });

  canvas.width = layout.totalWidth;
  canvas.height = layout.totalHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Draw images
  layout.positions.forEach((pos) => {
    const item = images.find((i) => i.id === pos.id);
    if (item) {
      ctx.drawImage(item.element, pos.x, pos.y, pos.width, pos.height);
    }
  });

  if (dimsBadge) {
    dimsBadge.textContent = `${layout.totalWidth} × ${layout.totalHeight} px`;
  }
}

function downloadMergedImage(mimeType: string = 'image/png'): void {
  const canvas = document.getElementById('merge-canvas') as HTMLCanvasElement;
  if (!canvas || images.length === 0) {
    showToast('No images loaded to merge', 'error');
    return;
  }

  canvas.toBlob((blob) => {
    if (blob) {
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `merged_${direction}_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Downloaded merged photo!', 'success');
    }
  }, mimeType, 0.95);
}

function loadDemoImages(): void {
  const makeDemoCanvas = (text: string, color1: string, color2: string, w = 300, h = 200): Promise<File> => {
    return new Promise((resolve) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
      c.toBlob((blob) => {
        resolve(new File([blob!], `${text.toLowerCase().replace(/\s+/g, '_')}.png`, { type: 'image/png' }));
      });
    });
  };

  Promise.all([
    makeDemoCanvas('Panel 1', '#3b82f6', '#1d4ed8'),
    makeDemoCanvas('Panel 2', '#10b981', '#047857'),
    makeDemoCanvas('Panel 3', '#8b5cf6', '#6d28d9'),
  ]).then((files) => {
    handleFiles(files);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMergerTool);
  } else {
    initMergerTool();
  }
}
