import { formatBytes } from '../utils/image-math.ts';
import { calculateScaledVideoDimensions, formatMediaTime } from '../utils/mediaUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initVideoCompressor(): void {
  const dropzone = document.getElementById('vc-dropzone');
  const fileInput = document.getElementById('vc-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('vc-workspace');
  const videoPreview = document.getElementById('vc-video') as HTMLVideoElement | null;
  const fileNameEl = document.getElementById('vc-file-name');
  const originalSizeEl = document.getElementById('vc-original-size');
  const originalDimsEl = document.getElementById('vc-original-dims');

  const presetSelect = document.getElementById('vc-preset') as HTMLSelectElement | null;
  const resolutionSelect = document.getElementById('vc-resolution') as HTMLSelectElement | null;
  const bitrateSlider = document.getElementById('vc-bitrate') as HTMLInputElement | null;
  const bitrateValEl = document.getElementById('vc-bitrate-val');

  const compressBtn = document.getElementById('vc-compress-btn') as HTMLButtonElement | null;
  const progressWrap = document.getElementById('vc-progress-wrap');
  const progressBar = document.getElementById('vc-progress-bar');
  const progressText = document.getElementById('vc-progress-text');

  const resultsCard = document.getElementById('vc-results-card');
  const compressedSizeEl = document.getElementById('vc-compressed-size');
  const savingsBadge = document.getElementById('vc-savings-badge');
  const downloadBtn = document.getElementById('vc-download-btn') as HTMLButtonElement | null;

  let originalFile: File | null = null;
  let compressedBlob: Blob | null = null;

  function loadVideo(file: File) {
    originalFile = file;
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (originalSizeEl) originalSizeEl.textContent = formatBytes(file.size);

    const url = URL.createObjectURL(file);
    if (videoPreview) {
      videoPreview.src = url;
      videoPreview.onloadedmetadata = () => {
        if (originalDimsEl) {
          originalDimsEl.textContent = `${videoPreview.videoWidth}x${videoPreview.videoHeight} (${formatMediaTime(videoPreview.duration)})`;
        }
        if (workspace) workspace.classList.remove('hidden');
        if (resultsCard) resultsCard.classList.add('hidden');
        if (compressBtn) compressBtn.removeAttribute('disabled');
        showToast('Video ready! Choose compression preset', 'success');
      };
    }
  }

  presetSelect?.addEventListener('change', () => {
    const val = presetSelect.value;
    if (val === 'discord') {
      if (resolutionSelect) resolutionSelect.value = '720';
      if (bitrateSlider) bitrateSlider.value = '800';
    } else if (val === 'web') {
      if (resolutionSelect) resolutionSelect.value = '720';
      if (bitrateSlider) bitrateSlider.value = '1500';
    } else if (val === 'mobile') {
      if (resolutionSelect) resolutionSelect.value = '480';
      if (bitrateSlider) bitrateSlider.value = '500';
    }
    if (bitrateValEl && bitrateSlider) bitrateValEl.textContent = `${bitrateSlider.value} kbps`;
  });

  bitrateSlider?.addEventListener('input', () => {
    if (bitrateValEl && bitrateSlider) bitrateValEl.textContent = `${bitrateSlider.value} kbps`;
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

  compressBtn?.addEventListener('click', async () => {
    if (!videoPreview || !videoPreview.duration || !originalFile) return;

    const targetHeight = parseInt(resolutionSelect?.value || '720', 10);
    const targetBitrateKbps = parseInt(bitrateSlider?.value || '1000', 10);
    const targetBitrate = targetBitrateKbps * 1000;

    const origW = videoPreview.videoWidth || 1280;
    const origH = videoPreview.videoHeight || 720;
    const maxW = Math.round((targetHeight / origH) * origW);
    const { width: targetW, height: finalH } = calculateScaledVideoDimensions(origW, origH, maxW, targetHeight);

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';
    if (progressText) progressText.textContent = `Compressing to ${targetW}x${finalH} @ ${targetBitrateKbps} kbps...`;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = canvas.captureStream(24);
    try {
      const audioStream = (videoPreview as any).captureStream?.() || (videoPreview as any).mozCaptureStream?.();
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.addTrack(track));
      }
    } catch {
      // Audio capture fallback
    }

    const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: targetBitrate,
    });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      compressedBlob = new Blob(chunks, { type: mime });
      const origSize = originalFile?.size || 1;
      const newSize = compressedBlob.size;
      const savedPct = Math.round(((origSize - newSize) / origSize) * 100);

      if (compressedSizeEl) compressedSizeEl.textContent = formatBytes(newSize);
      if (savingsBadge) {
        if (savedPct > 0) {
          savingsBadge.textContent = `Saved ${savedPct}%`;
          savingsBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
        } else {
          savingsBadge.textContent = 'High Quality Output';
          savingsBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
        }
      }

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Compression complete!';
      setTimeout(() => {
        if (progressWrap) progressWrap.classList.add('hidden');
      }, 800);

      if (resultsCard) resultsCard.classList.remove('hidden');
      showToast('Video compressed successfully!', 'success');
    };

    videoPreview.currentTime = 0;
    await new Promise((r) => setTimeout(r, 200));

    recorder.start();
    videoPreview.play();

    let animId: number;
    const encodeLoop = () => {
      ctx.drawImage(videoPreview, 0, 0, targetW, finalH);
      const pct = (videoPreview.currentTime / videoPreview.duration) * 100;
      if (progressBar) progressBar.style.width = `${Math.min(95, Math.max(10, pct))}%`;
      if (progressText) progressText.textContent = `Encoding video... ${Math.round(pct)}%`;

      if (!videoPreview.ended && !videoPreview.paused) {
        animId = requestAnimationFrame(encodeLoop);
      } else {
        cancelAnimationFrame(animId);
        if (recorder.state === 'recording') recorder.stop();
      }
    };
    encodeLoop();
  });

  downloadBtn?.addEventListener('click', () => {
    if (!compressedBlob || !originalFile) return;
    const ext = compressedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const base = originalFile.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(compressedBlob);
    a.download = `${base}-compressed.${ext}`;
    a.click();
    showToast('Compressed video downloaded!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoCompressor);
} else {
  initVideoCompressor();
}
