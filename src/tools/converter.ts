/**
 * Image Format Converter Tool (100% In-Browser)
 */
import JSZip from 'jszip';
import {
  ConversionOptions,
  formatToExtension,
  generateConvertedFilename,
  renderImageToCanvas,
  SUPPORTED_TARGET_FORMATS,
} from '../utils/converterUtils';
import { formatBytes } from '../utils/image-math';
import { showToast } from '../shared/site-shell';

interface ConvertItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  previewUrl: string;
  imgElement: HTMLImageElement;
  status: 'pending' | 'converting' | 'done' | 'error';
  convertedBlob?: Blob;
  convertedSize?: number;
  convertedUrl?: string;
}

let items: ConvertItem[] = [];
let targetFormat: ConversionOptions['format'] = 'image/png';
let quality = 0.9;
let backgroundColor = '#ffffff';

export function initConverterTool(): void {
  const dropzone = document.getElementById('conv-dropzone');
  const fileInput = document.getElementById('conv-file-input') as HTMLInputElement;
  const demoBtn = document.getElementById('conv-demo-btn');
  const formatSelect = document.getElementById('conv-format-select') as HTMLSelectElement;
  const qualitySlider = document.getElementById('conv-quality-slider') as HTMLInputElement;
  const qualityValue = document.getElementById('conv-quality-val');
  const qualityContainer = document.getElementById('conv-quality-container');
  const bgColorPicker = document.getElementById('conv-bg-color') as HTMLInputElement;
  const convertAllBtn = document.getElementById('conv-convert-all-btn');
  const downloadZipBtn = document.getElementById('conv-download-zip-btn');
  const clearAllBtn = document.getElementById('conv-clear-all-btn');

  if (!dropzone || !fileInput) return;

  // Format selection
  formatSelect?.addEventListener('change', () => {
    targetFormat = formatSelect.value as any;
    if (qualityContainer) {
      qualityContainer.style.display =
        targetFormat === 'image/jpeg' || targetFormat === 'image/webp' ? 'block' : 'none';
    }
  });

  // Quality slider
  qualitySlider?.addEventListener('input', () => {
    quality = parseFloat(qualitySlider.value);
    if (qualityValue) qualityValue.textContent = `${Math.round(quality * 100)}%`;
  });

  // Background color
  bgColorPicker?.addEventListener('input', () => {
    backgroundColor = bgColorPicker.value;
  });

  // File loading
  dropzone.addEventListener('click', () => fileInput.click());
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

  // Demo button
  demoBtn?.addEventListener('click', () => loadDemoImages());

  // Action buttons
  convertAllBtn?.addEventListener('click', () => processAllConversions());
  downloadZipBtn?.addEventListener('click', () => downloadZip());
  clearAllBtn?.addEventListener('click', () => clearAll());
}

async function handleFiles(files: File[]): Promise<void> {
  const validFiles = files.filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|avif|svg)$/i.test(f.name));
  if (validFiles.length === 0) {
    showToast('Please select valid image files.', 'error');
    return;
  }

  for (const file of validFiles) {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = previewUrl;
    });

    items.push({
      id,
      file,
      name: file.name,
      originalSize: file.size,
      previewUrl,
      imgElement: img,
      status: 'pending',
    });
  }

  updateUI();
  showToast(`Added ${validFiles.length} image(s)`, 'success');
}

function updateUI(): void {
  const emptyState = document.getElementById('conv-empty-state');
  const activeState = document.getElementById('conv-active-state');
  const list = document.getElementById('conv-items-list');
  const countBadge = document.getElementById('conv-count-badge');
  const downloadZipBtn = document.getElementById('conv-download-zip-btn') as HTMLButtonElement;

  if (items.length === 0) {
    emptyState?.classList.remove('hidden');
    activeState?.classList.add('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  activeState?.classList.remove('hidden');

  if (countBadge) countBadge.textContent = `${items.length} image${items.length > 1 ? 's' : ''}`;

  const hasDone = items.some((i) => i.status === 'done');
  if (downloadZipBtn) downloadZipBtn.disabled = !hasDone;

  if (!list) return;
  list.innerHTML = '';

  items.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className =
      'p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-xs';

    const statusBadge =
      item.status === 'done'
        ? `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Ready</span>`
        : item.status === 'converting'
        ? `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 animate-pulse">Converting...</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Pending</span>`;

    const convertedInfo =
      item.status === 'done' && item.convertedSize !== undefined
        ? `<span class="text-xs font-mono text-emerald-600 dark:text-emerald-400">&rarr; ${formatBytes(item.convertedSize)}</span>`
        : '';

    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <img src="${item.previewUrl}" alt="${item.name}" class="max-w-full max-h-full object-contain" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs" title="${item.name}">${item.name}</div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
            <span>${item.imgElement.width}×${item.imgElement.height} px</span>
            <span>&bull;</span>
            <span>${formatBytes(item.originalSize)}</span>
            ${convertedInfo}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${statusBadge}
        ${
          item.status === 'done' && item.convertedUrl
            ? `<a href="${item.convertedUrl}" download="${generateConvertedFilename(item.name, targetFormat)}" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1">Download</a>`
            : `<button type="button" data-convert-single="${item.id}" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer">Convert</button>`
        }
        <button type="button" data-remove-item="${item.id}" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer" title="Remove">&times;</button>
      </div>
    `;

    row.querySelector(`[data-convert-single="${item.id}"]`)?.addEventListener('click', () => {
      convertItem(item);
    });

    row.querySelector(`[data-remove-item="${item.id}"]`)?.addEventListener('click', () => {
      removeItem(item.id);
    });

    list.appendChild(row);
  });
}

async function convertItem(item: ConvertItem): Promise<void> {
  item.status = 'converting';
  updateUI();

  try {
    const canvas = renderImageToCanvas(
      item.imgElement,
      targetFormat === 'image/jpeg' || targetFormat === 'image/bmp' ? backgroundColor : undefined
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed'));
        },
        targetFormat,
        quality
      );
    });

    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    item.convertedBlob = blob;
    item.convertedSize = blob.size;
    item.convertedUrl = URL.createObjectURL(blob);
    item.status = 'done';
  } catch (err) {
    console.error('Conversion failed for', item.name, err);
    item.status = 'error';
    showToast(`Failed to convert ${item.name}`, 'error');
  }

  updateUI();
}

async function processAllConversions(): Promise<void> {
  showToast('Converting images...', 'info');
  for (const item of items) {
    await convertItem(item);
  }
  showToast('All conversions complete!', 'success');
}

async function downloadZip(): Promise<void> {
  const convertedItems = items.filter((i) => i.status === 'done' && i.convertedBlob);
  if (convertedItems.length === 0) {
    showToast('No converted images available to download', 'error');
    return;
  }

  const zip = new JSZip();
  convertedItems.forEach((item) => {
    const filename = generateConvertedFilename(item.name, targetFormat);
    zip.file(filename, item.convertedBlob!);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = `quickpic_converted_${formatToExtension(targetFormat)}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Downloaded ZIP archive!', 'success');
}

function removeItem(id: string): void {
  const item = items.find((i) => i.id === id);
  if (item) {
    URL.revokeObjectURL(item.previewUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  }
  items = items.filter((i) => i.id !== id);
  updateUI();
}

function clearAll(): void {
  items.forEach((item) => {
    URL.revokeObjectURL(item.previewUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  });
  items = [];
  updateUI();
}

function loadDemoImages(): void {
  // Create sample colored canvas
  const c1 = document.createElement('canvas');
  c1.width = 400;
  c1.height = 300;
  const ctx = c1.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Demo Graphic (PNG)', 200, 150);

  c1.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'demo_sample.png', { type: 'image/png' });
      handleFiles([file]);
    }
  }, 'image/png');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConverterTool);
  } else {
    initConverterTool();
  }
}
