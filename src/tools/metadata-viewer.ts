/**
 * Image Metadata & EXIF Viewer / Privacy Stripper Tool (100% In-Browser)
 */
import {
  parseExifFromArrayBuffer,
  ParsedExifData,
} from '../utils/metadataUtils';
import { formatBytes } from '../utils/image-math';
import { showToast } from '../shared/site-shell';

let currentFile: File | null = null;
let currentImage: HTMLImageElement | null = null;
let parsedData: ParsedExifData | null = null;

export function initMetadataViewerTool(): void {
  const dropzone = document.getElementById('meta-dropzone');
  const fileInput = document.getElementById('meta-file-input') as HTMLInputElement;
  const demoBtn = document.getElementById('meta-demo-btn');
  const stripBtn = document.getElementById('meta-strip-btn');
  const searchInput = document.getElementById('meta-search-input') as HTMLInputElement;

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
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
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  demoBtn?.addEventListener('click', () => loadDemoPhoto());
  stripBtn?.addEventListener('click', () => stripAndDownloadCleanPhoto());

  searchInput?.addEventListener('input', () => {
    filterRawTags(searchInput.value.toLowerCase());
  });
}

async function handleFile(file: File): Promise<void> {
  currentFile = file;
  const buffer = await file.arrayBuffer();

  // Try parsing EXIF
  parsedData = parseExifFromArrayBuffer(buffer);

  // Load preview image
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    renderMetadataUI(file, img, parsedData);
  };
  img.src = url;
}

function renderMetadataUI(
  file: File,
  img: HTMLImageElement,
  exif: ParsedExifData | null
): void {
  const emptyState = document.getElementById('meta-empty-state');
  const activeState = document.getElementById('meta-active-state');
  emptyState?.classList.add('hidden');
  activeState?.classList.remove('hidden');

  // Preview thumbnail
  const thumb = document.getElementById('meta-preview-img') as HTMLImageElement;
  if (thumb) thumb.src = img.src;

  // File basics
  const filenameEl = document.getElementById('meta-filename');
  const filesizeEl = document.getElementById('meta-filesize');
  const filetypeEl = document.getElementById('meta-filetype');
  const dimensionsEl = document.getElementById('meta-dimensions');
  const megapixelsEl = document.getElementById('meta-megapixels');

  if (filenameEl) filenameEl.textContent = file.name;
  if (filesizeEl) filesizeEl.textContent = formatBytes(file.size);
  if (filetypeEl) filetypeEl.textContent = file.type || 'image/jpeg';
  if (dimensionsEl) dimensionsEl.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;

  const mp = ((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(1);
  if (megapixelsEl) megapixelsEl.textContent = `${mp} MP`;

  // Camera & Settings
  const cameraEl = document.getElementById('meta-camera');
  const lensEl = document.getElementById('meta-lens');
  const exposureEl = document.getElementById('meta-exposure');
  const fNumberEl = document.getElementById('meta-fnumber');
  const isoEl = document.getElementById('meta-iso');
  const focalEl = document.getElementById('meta-focal');
  const dateEl = document.getElementById('meta-date');

  if (cameraEl) cameraEl.textContent = exif?.make && exif?.model ? `${exif.make} ${exif.model}` : exif?.model || 'Not Recorded';
  if (lensEl) lensEl.textContent = exif?.lensModel || 'Standard / Unspecified';
  if (exposureEl) exposureEl.textContent = exif?.exposureTime || '—';
  if (fNumberEl) fNumberEl.textContent = exif?.fNumber ? `f/${exif.fNumber}` : '—';
  if (isoEl) isoEl.textContent = exif?.iso ? `ISO ${exif.iso}` : '—';
  if (focalEl) focalEl.textContent = exif?.focalLength ? `${exif.focalLength} mm` : '—';
  if (dateEl) dateEl.textContent = exif?.dateTime || '—';

  // GPS card & privacy warning
  const gpsCard = document.getElementById('meta-gps-card');
  const gpsCoordsEl = document.getElementById('meta-gps-coords');
  const gpsLinkEl = document.getElementById('meta-gps-link') as HTMLAnchorElement;

  if (exif?.gps) {
    gpsCard?.classList.remove('hidden');
    if (gpsCoordsEl) gpsCoordsEl.textContent = `${exif.gps.latitude.toFixed(5)}°, ${exif.gps.longitude.toFixed(5)}°`;
    if (gpsLinkEl) gpsLinkEl.href = exif.gps.mapUrl;
  } else {
    gpsCard?.classList.add('hidden');
  }

  // Raw Tags Table
  renderRawTagsTable(exif?.rawTags || {});
  showToast('Metadata parsed successfully', 'success');
}

function renderRawTagsTable(tags: Record<string, any>): void {
  const tbody = document.getElementById('meta-tags-tbody');
  const countBadge = document.getElementById('meta-tags-count');
  if (!tbody) return;

  const entries = Object.entries(tags);
  if (countBadge) countBadge.textContent = `${entries.length} tags`;

  tbody.innerHTML = '';

  if (entries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="p-4 text-center text-xs text-slate-400">
          No EXIF tags found in this file (or image was already stripped).
        </td>
      </tr>
    `;
    return;
  }

  entries.forEach(([tag, val]) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300 w-1/3">${tag}</td>
      <td class="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs" title="${val}">${val}</td>
    `;
    tbody.appendChild(tr);
  });
}

function filterRawTags(query: string): void {
  const rows = document.querySelectorAll('#meta-tags-tbody tr');
  rows.forEach((row) => {
    const text = row.textContent?.toLowerCase() || '';
    (row as HTMLElement).style.display = text.includes(query) ? '' : 'none';
  });
}

function stripAndDownloadCleanPhoto(): void {
  if (!currentImage || !currentFile) {
    showToast('Please load an image first', 'error');
    return;
  }

  showToast('Stripping all EXIF and metadata...', 'info');

  const canvas = document.createElement('canvas');
  canvas.width = currentImage.naturalWidth || currentImage.width;
  canvas.height = currentImage.naturalHeight || currentImage.height;
  const ctx = canvas.getContext('2d')!;

  // Drawing to canvas automatically discards all EXIF / GPS / device metadata
  ctx.drawImage(currentImage, 0, 0);

  const format = currentFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'image/png' ? 'png' : 'jpg';

  canvas.toBlob((blob) => {
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const originalBase = currentFile!.name.substring(0, currentFile!.name.lastIndexOf('.')) || 'photo';
      a.download = `${originalBase}_stripped_clean.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Clean, metadata-free photo downloaded!', 'success');
    }
  }, format, 0.95);
}

function loadDemoPhoto(): void {
  // Create sample image with synthetic EXIF-like information
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 800;
  const ctx = c.getContext('2d')!;

  // Landscape gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#38bdf8');
  grad.addColorStop(1, '#059669');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sample Camera Photo (Demo EXIF)', 600, 380);

  c.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'sample_dslr_photo.jpg', { type: 'image/jpeg' });
      currentFile = file;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        parsedData = {
          make: 'Canon',
          model: 'EOS R5',
          lensModel: 'RF 24-70mm F2.8 L IS USM',
          software: 'Adobe Photoshop Lightroom',
          dateTime: '2026:10:24 14:32:18',
          exposureTime: '1/500s',
          fNumber: 2.8,
          iso: 100,
          focalLength: 50,
          pixelWidth: 1200,
          pixelHeight: 800,
          gps: {
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: 18,
            mapUrl: 'https://www.google.com/maps?q=37.7749,-122.4194',
          },
          rawTags: {
            Make: 'Canon',
            Model: 'EOS R5',
            LensModel: 'RF 24-70mm F2.8 L IS USM',
            ExposureTime: '1/500s',
            FNumber: 'f/2.8',
            ISO: '100',
            FocalLength: '50 mm',
            DateTimeOriginal: '2026:10:24 14:32:18',
            GPSLatitude: '37° 46\' 29.64" N',
            GPSLongitude: '122° 25\' 9.84" W',
            GPSAltitude: '18 m',
            ColorSpace: 'sRGB',
          },
        };
        renderMetadataUI(file, img, parsedData);
      };
      img.src = url;
    }
  }, 'image/jpeg', 0.95);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMetadataViewerTool);
  } else {
    initMetadataViewerTool();
  }
}
