/**
 * Passport & Visa Photo Maker Tool (100% In-Browser)
 */
import {
  calculatePrintSheetLayout,
  mmToPixels,
  PASSPORT_STANDARDS,
  PassportStandard,
} from '../utils/passportUtils';
import { showToast } from '../shared/site-shell';

let loadedImage: HTMLImageElement | null = null;
let currentStandard: PassportStandard = PASSPORT_STANDARDS.us;
let zoom = 1.0;
let panX = 0;
let panY = 0;
let rotation = 0; // degrees
let backgroundColor = '#ffffff';
let showBiometricGuide = true;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

export function initPassportTool(): void {
  const dropzone = document.getElementById('pass-dropzone');
  const fileInput = document.getElementById('pass-file-input') as HTMLInputElement;
  const demoBtn = document.getElementById('pass-demo-btn');
  const countrySelect = document.getElementById('pass-country-select') as HTMLSelectElement;
  const zoomSlider = document.getElementById('pass-zoom-slider') as HTMLInputElement;
  const rotateSlider = document.getElementById('pass-rotate-slider') as HTMLInputElement;
  const guideToggle = document.getElementById('pass-guide-toggle') as HTMLInputElement;
  const bgColorPicker = document.getElementById('pass-bg-color') as HTMLInputElement;
  const resetBtn = document.getElementById('pass-reset-btn');
  const downloadSingleBtn = document.getElementById('pass-download-single-btn');
  const downloadSheet4x6Btn = document.getElementById('pass-download-sheet-4x6');
  const downloadSheetA4Btn = document.getElementById('pass-download-sheet-a4');
  const canvas = document.getElementById('pass-canvas') as HTMLCanvasElement;

  if (!canvas || !fileInput) return;

  // File loading
  dropzone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadImageFile(file);
    fileInput.value = '';
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50/20');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/20');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/20');
    const file = e.dataTransfer?.files?.[0];
    if (file) loadImageFile(file);
  });

  demoBtn?.addEventListener('click', () => loadDemoPortrait());

  // Country standard selection
  countrySelect?.addEventListener('change', () => {
    const std = PASSPORT_STANDARDS[countrySelect.value];
    if (std) {
      currentStandard = std;
      updateStandardInfo();
      renderPassportCanvas();
    }
  });

  // Zoom & Rotation sliders
  zoomSlider?.addEventListener('input', () => {
    zoom = parseFloat(zoomSlider.value);
    renderPassportCanvas();
  });

  rotateSlider?.addEventListener('input', () => {
    rotation = parseInt(rotateSlider.value, 10);
    renderPassportCanvas();
  });

  guideToggle?.addEventListener('change', () => {
    showBiometricGuide = guideToggle.checked;
    renderPassportCanvas();
  });

  bgColorPicker?.addEventListener('input', () => {
    backgroundColor = bgColorPicker.value;
    renderPassportCanvas();
  });

  resetBtn?.addEventListener('click', () => {
    zoom = 1.0;
    panX = 0;
    panY = 0;
    rotation = 0;
    if (zoomSlider) zoomSlider.value = '1';
    if (rotateSlider) rotateSlider.value = '0';
    renderPassportCanvas();
  });

  // Canvas pan / drag
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startDragX = e.clientX - panX;
    startDragY = e.clientY - panY;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startDragX;
    panY = e.clientY - startDragY;
    renderPassportCanvas();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      if (canvas) canvas.style.cursor = 'grab';
    }
  });

  // Touch support for dragging photo on mobile
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startDragX = e.touches[0].clientX - panX;
      startDragY = e.touches[0].clientY - panY;
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    panX = e.touches[0].clientX - startDragX;
    panY = e.touches[0].clientY - startDragY;
    renderPassportCanvas();
  });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Download buttons
  downloadSingleBtn?.addEventListener('click', () => downloadSinglePhoto());
  downloadSheet4x6Btn?.addEventListener('click', () => downloadPrintSheet('4x6'));
  downloadSheetA4Btn?.addEventListener('click', () => downloadPrintSheet('a4'));
}

function loadImageFile(file: File): void {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    loadedImage = img;
    zoom = 1.0;
    panX = 0;
    panY = 0;
    rotation = 0;

    const emptyState = document.getElementById('pass-empty-state');
    const activeState = document.getElementById('pass-active-state');
    emptyState?.classList.add('hidden');
    activeState?.classList.remove('hidden');

    updateStandardInfo();
    renderPassportCanvas();
    showToast(`Loaded photo for ${currentStandard.country}`, 'success');
  };
  img.src = url;
}

function loadDemoPortrait(): void {
  // Generate a clean sample avatar canvas
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 750;
  const ctx = c.getContext('2d')!;

  // Studio background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 600, 750);

  // Shoulders
  ctx.beginPath();
  ctx.ellipse(300, 680, 240, 140, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Neck
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(265, 420, 70, 90);

  // Head oval
  ctx.beginPath();
  ctx.ellipse(300, 340, 110, 140, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fde68a';
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(260, 330, 8, 0, Math.PI * 2);
  ctx.arc(340, 330, 8, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(300, 390, 35, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#b45309';
  ctx.stroke();

  c.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'sample_portrait.png', { type: 'image/png' });
      loadImageFile(file);
    }
  }, 'image/png');
}

function updateStandardInfo(): void {
  const title = document.getElementById('pass-standard-title');
  const desc = document.getElementById('pass-standard-desc');
  const dims = document.getElementById('pass-standard-dims');

  if (title) title.textContent = currentStandard.name;
  if (desc) desc.textContent = currentStandard.description;
  if (dims) dims.textContent = `${currentStandard.widthMm} × ${currentStandard.heightMm} mm (300 DPI: ${mmToPixels(currentStandard.widthMm)}×${mmToPixels(currentStandard.heightMm)} px)`;
}

function renderPassportCanvas(exportMode: boolean = false): HTMLCanvasElement {
  const canvas = (
    exportMode
      ? document.createElement('canvas')
      : document.getElementById('pass-canvas')
  ) as HTMLCanvasElement;

  if (!canvas || !loadedImage) return canvas;

  const widthPx = mmToPixels(currentStandard.widthMm, 300);
  const heightPx = mmToPixels(currentStandard.heightMm, 300);

  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d')!;

  // Fill background color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Draw photo with pan, zoom, rotation
  ctx.save();
  ctx.translate(widthPx / 2 + panX, heightPx / 2 + panY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(zoom, zoom);

  // Center photo
  const imgW = loadedImage.naturalWidth || loadedImage.width;
  const imgH = loadedImage.naturalHeight || loadedImage.height;

  // Scale image to fill viewport initially
  const scale = Math.max(widthPx / imgW, heightPx / imgH);
  ctx.drawImage(loadedImage, (-imgW * scale) / 2, (-imgH * scale) / 2, imgW * scale, imgH * scale);
  ctx.restore();

  // Draw Biometric Face Alignment Guide (Only in interactive UI, not in exported file)
  if (showBiometricGuide && !exportMode) {
    drawBiometricGuide(ctx, widthPx, heightPx);
  }

  return canvas;
}

function drawBiometricGuide(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.75)'; // blue guide
  ctx.setLineDash([4, 4]);

  const centerX = w / 2;
  const centerY = h * 0.48;
  const headRadiusX = w * 0.28;
  const headRadiusY = h * 0.32;

  // Head oval
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Eye-line indicator
  const eyeLineY = centerY - headRadiusY * 0.15;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; // green eye level
  ctx.beginPath();
  ctx.moveTo(centerX - headRadiusX * 1.2, eyeLineY);
  ctx.lineTo(centerX + headRadiusX * 1.2, eyeLineY);
  ctx.stroke();

  // Center vertical line
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - headRadiusY * 1.3);
  ctx.lineTo(centerX, centerY + headRadiusY * 1.3);
  ctx.stroke();

  // Legend text
  ctx.setLineDash([]);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
  ctx.textAlign = 'right';
  ctx.fillText('Eye Level', w - 8, eyeLineY - 4);

  ctx.restore();
}

function downloadSinglePhoto(): void {
  if (!loadedImage) {
    showToast('Please load a photo first', 'error');
    return;
  }
  const canvas = renderPassportCanvas(true);
  canvas.toBlob((blob) => {
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `passport_${currentStandard.id}_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Downloaded single passport photo!', 'success');
    }
  }, 'image/png');
}

function downloadPrintSheet(sheetType: '4x6' | 'a4'): void {
  if (!loadedImage) {
    showToast('Please load a photo first', 'error');
    return;
  }

  showToast(`Generating ${sheetType.toUpperCase()} print sheet...`, 'info');

  const photoCanvas = renderPassportCanvas(true);
  const layout = calculatePrintSheetLayout(photoCanvas.width, photoCanvas.height, sheetType, 300);

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = layout.sheetWidthPx;
  sheetCanvas.height = layout.sheetHeightPx;
  const ctx = sheetCanvas.getContext('2d')!;

  // Fill sheet background (White paper)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

  // Draw photos with subtle border/cut lines
  layout.positions.forEach((pos) => {
    ctx.drawImage(photoCanvas, pos.x, pos.y);

    // Subtle cut line
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(pos.x, pos.y, photoCanvas.width, photoCanvas.height);
  });

  // Footer label on margin
  ctx.setLineDash([]);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Toolora • ${currentStandard.name} • ${layout.totalPhotos} Photos (${sheetType.toUpperCase()} Sheet @ 300 DPI)`,
    sheetCanvas.width / 2,
    sheetCanvas.height - 12
  );

  sheetCanvas.toBlob((blob) => {
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `passport_sheet_${sheetType}_${currentStandard.id}_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(`Downloaded ${sheetType.toUpperCase()} print sheet with ${layout.totalPhotos} photos!`, 'success');
    }
  }, 'image/jpeg', 0.98);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPassportTool);
  } else {
    initPassportTool();
  }
}
