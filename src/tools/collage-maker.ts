/**
 * Photo Collage Maker Tool (100% In-Browser)
 */
import {
  calculateCollageSlots,
  calculateCoverCrop,
  COLLAGE_ASPECT_RATIOS,
  type CollagePreset,
  type CollageSlot,
} from '../utils/collageUtils.ts';
import { showToast } from '../shared/site-shell.ts';

interface CollagePhotoItem {
  id: string;
  file?: File;
  img: HTMLImageElement;
  name: string;
}

let photos: CollagePhotoItem[] = [];
let currentPreset: CollagePreset = '4-grid';
let currentAspectRatio = '1:1';
let spacing = 16;
let cornerRadius = 12;
let backgroundColor = '#ffffff';

// DOM Elements
const dropzone = document.getElementById('collage-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('collage-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('collage-workspace') as HTMLElement | null;
const canvas = document.getElementById('collage-canvas') as HTMLCanvasElement | null;
const demoBtn = document.getElementById('collage-demo-btn') as HTMLButtonElement | null;
const addMoreBtn = document.getElementById('collage-add-more-btn') as HTMLButtonElement | null;
const clearBtn = document.getElementById('collage-clear-btn') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('collage-download-btn') as HTMLButtonElement | null;
const formatSelect = document.getElementById('collage-format-select') as HTMLSelectElement | null;

// Sliders & Selectors
const presetButtons = document.querySelectorAll<HTMLButtonElement>('[data-collage-preset]');
const aspectSelect = document.getElementById('collage-aspect-select') as HTMLSelectElement | null;
const spacingSlider = document.getElementById('collage-spacing-slider') as HTMLInputElement | null;
const spacingVal = document.getElementById('collage-spacing-val') as HTMLElement | null;
const radiusSlider = document.getElementById('collage-radius-slider') as HTMLInputElement | null;
const radiusVal = document.getElementById('collage-radius-val') as HTMLElement | null;
const bgColorPicker = document.getElementById('collage-bg-color') as HTMLInputElement | null;
const photoStrip = document.getElementById('collage-photo-strip') as HTMLElement | null;
const photoCountBadge = document.getElementById('collage-photo-count') as HTMLElement | null;

export function initCollageTool(): void {
  if (!dropzone || !fileInput || !canvas) return;

  dropzone.addEventListener('click', () => fileInput.click());
  addMoreBtn?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) handleFiles(Array.from(files));
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
    const files = e.dataTransfer?.files;
    if (files) handleFiles(Array.from(files));
  });

  demoBtn?.addEventListener('click', loadDemoPhotos);

  // Preset Selection
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetButtons.forEach((b) => b.classList.remove('border-blue-600', 'bg-blue-50', 'dark:bg-blue-950/50', 'text-blue-600', 'dark:text-blue-400'));
      btn.classList.add('border-blue-600', 'bg-blue-50', 'dark:bg-blue-950/50', 'text-blue-600', 'dark:text-blue-400');
      currentPreset = (btn.getAttribute('data-collage-preset') as CollagePreset) || '4-grid';
      render();
    });
  });

  aspectSelect?.addEventListener('change', () => {
    currentAspectRatio = aspectSelect.value || '1:1';
    render();
  });

  spacingSlider?.addEventListener('input', () => {
    spacing = parseInt(spacingSlider.value, 10) || 0;
    if (spacingVal) spacingVal.textContent = `${spacing}px`;
    render();
  });

  radiusSlider?.addEventListener('input', () => {
    cornerRadius = parseInt(radiusSlider.value, 10) || 0;
    if (radiusVal) radiusVal.textContent = `${cornerRadius}px`;
    render();
  });

  bgColorPicker?.addEventListener('input', () => {
    backgroundColor = bgColorPicker.value || '#ffffff';
    render();
  });

  clearBtn?.addEventListener('click', () => {
    photos = [];
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadBtn?.addEventListener('click', handleDownload);
}

function handleFiles(files: File[]) {
  const validFiles = files.filter((f) => f.type.startsWith('image/'));
  if (validFiles.length === 0) return;

  let loadedCount = 0;
  validFiles.forEach((file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photos.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        img,
        name: file.name,
      });
      loadedCount++;
      if (loadedCount === validFiles.length) {
        updateUI();
        showToast(`Added ${validFiles.length} photos to collage!`, 'success');
      }
    };
    img.src = url;
  });
}

function loadDemoPhotos() {
  photos = [];
  const colors = [
    ['#3b82f6', '#1d4ed8', 'Sky Blue'],
    ['#ec4899', '#be185d', 'Rose Sunset'],
    ['#10b981', '#047857', 'Emerald Mint'],
    ['#f59e0b', '#b45309', 'Amber Glow'],
  ];

  colors.forEach(([c1, c2, label], idx) => {
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 800;
    dCanvas.height = 800;
    const ctx = dCanvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 800, 800);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 800);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 400, 400);

    const img = new Image();
    img.onload = () => {
      photos.push({
        id: 'demo_' + idx,
        img,
        name: label,
      });
      if (photos.length === 4) {
        currentPreset = '4-grid';
        updateUI();
      }
    };
    img.src = dCanvas.toDataURL();
  });
}

function updateUI() {
  if (photos.length === 0) {
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
    return;
  }

  dropzone?.classList.add('hidden');
  workspace?.classList.remove('hidden');

  if (photoCountBadge) {
    photoCountBadge.textContent = `${photos.length} photos`;
  }

  renderPhotoStrip();
  render();
}

function renderPhotoStrip() {
  if (!photoStrip) return;
  photoStrip.innerHTML = '';

  photos.forEach((item, idx) => {
    const chip = document.createElement('div');
    chip.className =
      'flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 flex-shrink-0';

    chip.innerHTML = `
      <img src="${item.img.src}" class="w-6 h-6 rounded-lg object-cover bg-white" alt="${item.name}" />
      <span class="max-w-[100px] truncate text-slate-800 dark:text-slate-200">${item.name}</span>
      <button type="button" data-del="${idx}" class="text-rose-500 hover:text-rose-700 cursor-pointer text-sm leading-none font-bold" title="Remove">&times;</button>
    `;

    chip.querySelector('[data-del]')?.addEventListener('click', () => {
      photos.splice(idx, 1);
      updateUI();
    });

    photoStrip.appendChild(chip);
  });
}

function render() {
  if (!canvas || photos.length === 0) return;

  const baseDim = COLLAGE_ASPECT_RATIOS[currentAspectRatio] || COLLAGE_ASPECT_RATIOS['1:1'];
  const canvasW = baseDim.width;
  const canvasH = baseDim.height;

  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Fill Canvas Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Compute Slots
  const slots: CollageSlot[] = calculateCollageSlots(canvasW, canvasH, currentPreset, spacing);

  // 3. Draw Photos into Slots with Object-Fit Cover & Rounded Corners
  slots.forEach((slot, slotIdx) => {
    const photo = photos[slotIdx % photos.length];
    if (!photo) return;

    ctx.save();

    // Clip to rounded slot rectangle
    ctx.beginPath();
    const r = Math.min(cornerRadius, slot.width / 2, slot.height / 2);
    if ((ctx as any).roundRect) {
      (ctx as any).roundRect(slot.x, slot.y, slot.width, slot.height, r);
    } else {
      ctx.rect(slot.x, slot.y, slot.width, slot.height);
    }
    ctx.clip();

    // Calculate crop
    const crop = calculateCoverCrop(
      photo.img.naturalWidth,
      photo.img.naturalHeight,
      slot.width,
      slot.height
    );

    ctx.drawImage(
      photo.img,
      crop.sx,
      crop.sy,
      crop.sWidth,
      crop.sHeight,
      slot.x,
      slot.y,
      slot.width,
      slot.height
    );

    ctx.restore();
  });
}

function handleDownload() {
  if (!canvas || photos.length === 0) return;

  const format = formatSelect?.value || 'image/png';
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_collage_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Collage downloaded successfully!', 'success');
    },
    format,
    0.95
  );
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollageTool);
} else {
  initCollageTool();
}
