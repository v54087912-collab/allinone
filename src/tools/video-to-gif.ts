import { createSimpleGif, calculateScaledVideoDimensions, formatMediaTime } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initVideoToGif(): void {
  const dropzone = document.getElementById('v2g-dropzone');
  const fileInput = document.getElementById('v2g-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('v2g-workspace');
  const video = document.getElementById('v2g-video') as HTMLVideoElement | null;
  const fileNameEl = document.getElementById('v2g-file-name');
  const totalDurationEl = document.getElementById('v2g-total-duration');
  const cutDurationEl = document.getElementById('v2g-cut-duration');

  const startTimeInput = document.getElementById('v2g-start-time') as HTMLInputElement | null;
  const endTimeInput = document.getElementById('v2g-end-time') as HTMLInputElement | null;
  const setStartBtn = document.getElementById('v2g-set-start-btn') as HTMLButtonElement | null;
  const setEndBtn = document.getElementById('v2g-set-end-btn') as HTMLButtonElement | null;

  const widthSelect = document.getElementById('v2g-width') as HTMLSelectElement | null;
  const fpsSelect = document.getElementById('v2g-fps') as HTMLSelectElement | null;

  const convertBtn = document.getElementById('v2g-convert-btn') as HTMLButtonElement | null;
  const progressWrap = document.getElementById('v2g-progress-wrap');
  const progressBar = document.getElementById('v2g-progress-bar');
  const progressText = document.getElementById('v2g-progress-text');

  const resultCard = document.getElementById('v2g-result-card');
  const gifImg = document.getElementById('v2g-gif-preview') as HTMLImageElement | null;
  const gifSizeEl = document.getElementById('v2g-gif-size');
  const downloadBtn = document.getElementById('v2g-download-btn') as HTMLButtonElement | null;

  let originalFile: File | null = null;
  let generatedGifBlob: Blob | null = null;

  function updateCutInfo() {
    if (!video || !video.duration) return;
    const dur = video.duration;
    let start = parseFloat(startTimeInput?.value || '0');
    let end = parseFloat(endTimeInput?.value || '5');

    if (isNaN(start) || start < 0) start = 0;
    if (start > dur) start = Math.max(0, dur - 0.5);
    if (isNaN(end) || end <= start) end = Math.min(dur, start + 3);
    if (end > dur) end = dur;

    // Cap at 15s for browser GIF performance
    if (end - start > 15) {
      end = start + 15;
    }

    if (cutDurationEl) cutDurationEl.textContent = `${(end - start).toFixed(1)}s`;
  }

  function loadVideo(file: File) {
    originalFile = file;
    if (fileNameEl) fileNameEl.textContent = file.name;

    const url = URL.createObjectURL(file);
    if (video) {
      video.src = url;
      video.onloadedmetadata = () => {
        const dur = video.duration || 10;
        if (totalDurationEl) totalDurationEl.textContent = formatMediaTime(dur);

        if (startTimeInput) {
          startTimeInput.max = dur.toFixed(1);
          startTimeInput.value = '0.0';
        }
        if (endTimeInput) {
          endTimeInput.max = dur.toFixed(1);
          endTimeInput.value = Math.min(5, dur).toFixed(1);
        }

        updateCutInfo();
        if (workspace) workspace.classList.remove('hidden');
        if (resultCard) resultCard.classList.add('hidden');
        if (convertBtn) convertBtn.removeAttribute('disabled');
        showToast('Video ready! Scrub and choose clip range', 'success');
      };
    }
  }

  // Click on dropzone opens file dialog
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput?.click();
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      loadVideo(file);
      fileInput.value = '';
    }
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-amber-500');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-amber-500'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-amber-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadVideo(file);
  });

  startTimeInput?.addEventListener('input', updateCutInfo);
  endTimeInput?.addEventListener('input', updateCutInfo);

  setStartBtn?.addEventListener('click', () => {
    if (!video) return;
    const current = video.currentTime;
    if (startTimeInput) startTimeInput.value = current.toFixed(1);
    updateCutInfo();
    showToast(`Start time set to ${current.toFixed(1)}s`, 'info');
  });

  setEndBtn?.addEventListener('click', () => {
    if (!video) return;
    const current = video.currentTime;
    if (endTimeInput) endTimeInput.value = current.toFixed(1);
    updateCutInfo();
    showToast(`End time set to ${current.toFixed(1)}s`, 'info');
  });

  convertBtn?.addEventListener('click', async () => {
    if (!video || !video.duration || !originalFile) return;

    let start = parseFloat(startTimeInput?.value || '0');
    let end = parseFloat(endTimeInput?.value || '5');
    if (start >= end) {
      showToast('Start time must be less than end time', 'error');
      return;
    }

    const clipDuration = Math.min(15, end - start);
    const targetWidth = parseInt(widthSelect?.value || '400', 10);
    const fps = parseInt(fpsSelect?.value || '10', 10);

    const origW = video.videoWidth || 640;
    const origH = video.videoHeight || 360;
    const { width: finalW, height: finalH } = calculateScaledVideoDimensions(origW, origH, targetWidth, targetWidth);

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '5%';
    if (progressText) progressText.textContent = 'Seeking video frames...';

    const canvas = document.createElement('canvas');
    canvas.width = finalW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameInterval = 1 / fps;
    const totalFrames = Math.max(1, Math.floor(clipDuration * fps));
    const capturedFrames: Uint8ClampedArray[] = [];

    video.pause();

    for (let f = 0; f < totalFrames; f++) {
      const seekTime = Math.min(video.duration, start + f * frameInterval);
      video.currentTime = seekTime;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      ctx.drawImage(video, 0, 0, finalW, finalH);
      const imgData = ctx.getImageData(0, 0, finalW, finalH);
      capturedFrames.push(imgData.data);

      const pct = Math.round(((f + 1) / totalFrames) * 60);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `Captured frame ${f + 1} of ${totalFrames}...`;
    }

    if (progressBar) progressBar.style.width = '75%';
    if (progressText) progressText.textContent = 'Encoding animated GIF stream...';
    await new Promise((r) => setTimeout(r, 60));

    const delayMs = Math.round(1000 / fps);
    const gifBytes = createSimpleGif(finalW, finalH, capturedFrames, delayMs);
    generatedGifBlob = new Blob([gifBytes.buffer as ArrayBuffer], { type: 'image/gif' });

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'GIF generated successfully!';
    setTimeout(() => {
      if (progressWrap) progressWrap.classList.add('hidden');
    }, 500);

    if (gifImg) gifImg.src = URL.createObjectURL(generatedGifBlob);
    if (gifSizeEl) gifSizeEl.textContent = formatBytes(generatedGifBlob.size);
    if (resultCard) resultCard.classList.remove('hidden');
    showToast('Animated GIF created from video clip!', 'success');
  });

  downloadBtn?.addEventListener('click', () => {
    if (!generatedGifBlob || !originalFile) return;
    const base = originalFile.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(generatedGifBlob);
    a.download = `${base}.gif`;
    a.click();
    showToast('GIF downloaded!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoToGif);
} else {
  initVideoToGif();
}
