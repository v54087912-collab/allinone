import { formatMediaTime } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initVideoTrimmer(): void {
  const dropzone = document.getElementById('vt-dropzone');
  const fileInput = document.getElementById('vt-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('vt-workspace');
  const videoPlayer = document.getElementById('vt-video') as HTMLVideoElement | null;
  const fileNameEl = document.getElementById('vt-file-name');
  const fileSizeEl = document.getElementById('vt-file-size');
  const totalDurationEl = document.getElementById('vt-total-duration');

  const startInput = document.getElementById('vt-start-time') as HTMLInputElement | null;
  const endInput = document.getElementById('vt-end-time') as HTMLInputElement | null;
  const cutDurationEl = document.getElementById('vt-cut-duration');
  const previewCutBtn = document.getElementById('vt-preview-cut-btn') as HTMLButtonElement | null;
  const exportBtn = document.getElementById('vt-export-btn') as HTMLButtonElement | null;
  const progressWrap = document.getElementById('vt-progress-wrap');
  const progressBar = document.getElementById('vt-progress-bar');
  const progressText = document.getElementById('vt-progress-text');

  let originalBaseName = 'trimmed-video';
  let isPreviewingCut = false;

  function updateCutTimes() {
    if (!videoPlayer || !videoPlayer.duration) return;
    const duration = videoPlayer.duration;
    let start = parseFloat(startInput?.value || '0');
    let end = parseFloat(endInput?.value || String(duration));

    if (start < 0) start = 0;
    if (end > duration) end = duration;
    if (start >= end) start = Math.max(0, end - 0.1);

    if (startInput) startInput.value = start.toFixed(1);
    if (endInput) endInput.value = end.toFixed(1);
    if (cutDurationEl) cutDurationEl.textContent = formatMediaTime(end - start, true);
  }

  function loadVideo(file: File) {
    originalBaseName = file.name.replace(/\.[^/.]+$/, '');
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

    const url = URL.createObjectURL(file);
    if (videoPlayer) {
      videoPlayer.src = url;
      videoPlayer.onloadedmetadata = () => {
        if (totalDurationEl) totalDurationEl.textContent = formatMediaTime(videoPlayer.duration);
        if (startInput) {
          startInput.max = String(videoPlayer.duration);
          startInput.value = '0';
        }
        if (endInput) {
          endInput.max = String(videoPlayer.duration);
          endInput.value = videoPlayer.duration.toFixed(1);
        }
        updateCutTimes();
        if (workspace) workspace.classList.remove('hidden');
        if (exportBtn) exportBtn.removeAttribute('disabled');
        if (previewCutBtn) previewCutBtn.removeAttribute('disabled');
        showToast('Video ready! Select start and end points', 'success');
      };
    }
  }

  videoPlayer?.addEventListener('timeupdate', () => {
    if (isPreviewingCut && videoPlayer) {
      const end = parseFloat(endInput?.value || '0');
      if (videoPlayer.currentTime >= end) {
        videoPlayer.pause();
        isPreviewingCut = false;
        if (previewCutBtn) previewCutBtn.textContent = '▶ Preview Cut';
      }
    }
  });

  previewCutBtn?.addEventListener('click', () => {
    if (!videoPlayer) return;
    if (isPreviewingCut) {
      videoPlayer.pause();
      isPreviewingCut = false;
      if (previewCutBtn) previewCutBtn.textContent = '▶ Preview Cut';
      return;
    }

    const start = parseFloat(startInput?.value || '0');
    videoPlayer.currentTime = start;
    videoPlayer.play();
    isPreviewingCut = true;
    if (previewCutBtn) previewCutBtn.textContent = '⏸ Pause Preview';
  });

  startInput?.addEventListener('input', () => {
    updateCutTimes();
    if (videoPlayer && startInput) videoPlayer.currentTime = parseFloat(startInput.value);
  });

  endInput?.addEventListener('input', () => {
    updateCutTimes();
    if (videoPlayer && endInput) videoPlayer.currentTime = parseFloat(endInput.value);
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

  exportBtn?.addEventListener('click', async () => {
    if (!videoPlayer || !videoPlayer.duration) return;

    const start = parseFloat(startInput?.value || '0');
    const end = parseFloat(endInput?.value || String(videoPlayer.duration));
    const duration = Math.max(0.5, end - start);

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';
    if (progressText) progressText.textContent = 'Preparing video recording...';

    // Canvas to capture stream
    const canvas = document.createElement('canvas');
    canvas.width = videoPlayer.videoWidth || 1280;
    canvas.height = videoPlayer.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = canvas.captureStream(30);

    // Capture audio track if supported
    try {
      const audioStream = (videoPlayer as any).captureStream?.() || (videoPlayer as any).mozCaptureStream?.();
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.addTrack(track));
      }
    } catch {
      // Audio capture fallback
    }

    const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      a.download = `${originalBaseName}-cut.${ext}`;
      a.click();

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Export complete!';
      setTimeout(() => {
        if (progressWrap) progressWrap.classList.add('hidden');
      }, 1000);
      showToast('Trimmed video exported!', 'success');
    };

    videoPlayer.currentTime = start;
    await new Promise((r) => setTimeout(r, 200));

    recorder.start();
    videoPlayer.play();

    let animId: number;
    const drawFrame = () => {
      ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
      const progress = ((videoPlayer.currentTime - start) / duration) * 100;
      if (progressBar) progressBar.style.width = `${Math.min(95, Math.max(10, progress))}%`;
      if (progressText) progressText.textContent = `Encoding clip... ${Math.round(progress)}%`;

      if (videoPlayer.currentTime < end && !videoPlayer.ended && !videoPlayer.paused) {
        animId = requestAnimationFrame(drawFrame);
      } else {
        cancelAnimationFrame(animId);
        videoPlayer.pause();
        if (recorder.state === 'recording') recorder.stop();
      }
    };
    drawFrame();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoTrimmer);
} else {
  initVideoTrimmer();
}
