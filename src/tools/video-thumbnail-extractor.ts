import JSZip from 'jszip';
import { formatMediaTime, generateThumbnailTimestamps } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

interface CapturedThumbnail {
  timestamp: number;
  dataUrl: string;
  blob: Blob;
}

export function initThumbnailExtractor(): void {
  const dropzone = document.getElementById('vte-dropzone');
  const fileInput = document.getElementById('vte-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('vte-workspace');
  const video = document.getElementById('vte-video') as HTMLVideoElement | null;
  const fileNameEl = document.getElementById('vte-file-name');
  const durationEl = document.getElementById('vte-duration');

  const scrubSlider = document.getElementById('vte-scrub') as HTMLInputElement | null;
  const currentTimeEl = document.getElementById('vte-current-time');
  const captureCurrentBtn = document.getElementById('vte-capture-current') as HTMLButtonElement | null;
  const autoExtractBtn = document.getElementById('vte-auto-extract') as HTMLButtonElement | null;
  const formatSelect = document.getElementById('vte-format') as HTMLSelectElement | null;

  const gallery = document.getElementById('vte-gallery');
  const countBadge = document.getElementById('vte-count-badge');
  const downloadAllBtn = document.getElementById('vte-download-all') as HTMLButtonElement | null;

  let originalFile: File | null = null;
  const capturedThumbs: CapturedThumbnail[] = [];

  function loadVideo(file: File) {
    originalFile = file;
    if (fileNameEl) fileNameEl.textContent = `${file.name} (${formatBytes(file.size)})`;

    const url = URL.createObjectURL(file);
    if (video) {
      video.src = url;
      video.onloadedmetadata = () => {
        if (durationEl) durationEl.textContent = formatMediaTime(video.duration);
        if (scrubSlider) {
          scrubSlider.max = String(video.duration);
          scrubSlider.value = '0';
        }
        if (currentTimeEl) currentTimeEl.textContent = '00:00.0';
        if (workspace) workspace.classList.remove('hidden');
        showToast('Video ready! Scrub and capture thumbnails', 'success');
      };
    }
  }

  function captureFrame(time: number): Promise<CapturedThumbnail> {
    return new Promise((resolve) => {
      if (!video) return;

      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const format = formatSelect?.value || 'png';
        const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const dataUrl = canvas.toDataURL(mime, 0.95);

        canvas.toBlob(
          (blob) => {
            resolve({
              timestamp: time,
              dataUrl,
              blob: blob || new Blob(),
            });
          },
          mime,
          0.95
        );
      };

      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  }

  function renderGallery() {
    if (!gallery) return;
    gallery.innerHTML = '';

    capturedThumbs.forEach((thumb, idx) => {
      const card = document.createElement('div');
      card.className = 'group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between';

      card.innerHTML = `
        <div class="relative aspect-video bg-black/10 overflow-hidden">
          <img src="${thumb.dataUrl}" alt="Thumbnail at ${formatMediaTime(thumb.timestamp)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white">${formatMediaTime(thumb.timestamp, true)}</span>
        </div>
        <div class="p-3 flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">#${idx + 1}</span>
          <button type="button" class="download-card-btn px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">Save</button>
        </div>
      `;

      card.querySelector('.download-card-btn')?.addEventListener('click', () => {
        const format = formatSelect?.value || 'png';
        const base = originalFile?.name.replace(/\.[^/.]+$/, '') || 'thumb';
        const a = document.createElement('a');
        a.href = thumb.dataUrl;
        a.download = `${base}-thumb-${formatMediaTime(thumb.timestamp).replace(':', 'm')}s.${format}`;
        a.click();
        showToast('Thumbnail saved!', 'success');
      });

      gallery.appendChild(card);
    });

    if (countBadge) countBadge.textContent = `${capturedThumbs.length} Thumbnails Captured`;
    if (downloadAllBtn) {
      if (capturedThumbs.length > 0) {
        downloadAllBtn.removeAttribute('disabled');
      } else {
        downloadAllBtn.setAttribute('disabled', 'true');
      }
    }
  }

  scrubSlider?.addEventListener('input', () => {
    if (!video) return;
    const time = parseFloat(scrubSlider.value);
    video.currentTime = time;
    if (currentTimeEl) currentTimeEl.textContent = formatMediaTime(time, true);
  });

  video?.addEventListener('timeupdate', () => {
    if (currentTimeEl && video) currentTimeEl.textContent = formatMediaTime(video.currentTime, true);
  });

  captureCurrentBtn?.addEventListener('click', async () => {
    if (!video) return;
    const time = video.currentTime;
    const thumb = await captureFrame(time);
    capturedThumbs.push(thumb);
    renderGallery();
    showToast(`Thumbnail captured at ${formatMediaTime(time, true)}!`, 'success');
  });

  autoExtractBtn?.addEventListener('click', async () => {
    if (!video || !video.duration) return;
    showToast('Extracting 10 thumbnails across video...', 'info');
    capturedThumbs.length = 0;

    const timestamps = generateThumbnailTimestamps(video.duration, 10);
    for (const t of timestamps) {
      const thumb = await captureFrame(t);
      capturedThumbs.push(thumb);
    }
    renderGallery();
    showToast('10 thumbnails extracted!', 'success');
  });

  downloadAllBtn?.addEventListener('click', async () => {
    if (capturedThumbs.length === 0 || !originalFile) return;
    const zip = new JSZip();
    const format = formatSelect?.value || 'png';
    const base = originalFile.name.replace(/\.[^/.]+$/, '');

    capturedThumbs.forEach((thumb, idx) => {
      const b64 = thumb.dataUrl.split(',')[1];
      const filename = `${base}_thumb_${idx + 1}_${formatMediaTime(thumb.timestamp).replace(':', 'm')}s.${format}`;
      zip.file(filename, b64, { base64: true });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${base}-thumbnails.zip`;
    a.click();
    showToast('All thumbnails downloaded in ZIP!', 'success');
  });

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadVideo(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-blue-500'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadVideo(file);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThumbnailExtractor);
} else {
  initThumbnailExtractor();
}
