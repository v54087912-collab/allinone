import { formatMediaTime, audioBufferToWav } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initAudioSpeedChanger(): void {
  const dropzone = document.getElementById('asc-dropzone');
  const fileInput = document.getElementById('asc-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('asc-workspace');
  const fileNameEl = document.getElementById('asc-file-name');
  const originalDurationEl = document.getElementById('asc-orig-duration');
  const newDurationEl = document.getElementById('asc-new-duration');

  const speedSlider = document.getElementById('asc-speed') as HTMLInputElement | null;
  const speedValEl = document.getElementById('asc-speed-val');
  const audioPreview = document.getElementById('asc-audio') as HTMLAudioElement | null;
  const processBtn = document.getElementById('asc-process-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('asc-download-btn') as HTMLButtonElement | null;

  const progressWrap = document.getElementById('asc-progress-wrap');
  const progressBar = document.getElementById('asc-progress-bar');
  const progressText = document.getElementById('asc-progress-text');

  let originalFile: File | null = null;
  let decodedBuffer: AudioBuffer | null = null;
  let processedBlob: Blob | null = null;

  function updateSpeedDisplays() {
    const speed = parseFloat(speedSlider?.value || '1.0');
    if (speedValEl) speedValEl.textContent = `${speed.toFixed(2)}x`;
    if (audioPreview) audioPreview.playbackRate = speed;

    if (decodedBuffer && newDurationEl) {
      const newSec = decodedBuffer.duration / speed;
      newDurationEl.textContent = formatMediaTime(newSec);
    }
  }

  async function loadAudio(file: File) {
    originalFile = file;
    if (fileNameEl) fileNameEl.textContent = `${file.name} (${formatBytes(file.size)})`;

    const url = URL.createObjectURL(file);
    if (audioPreview) audioPreview.src = url;

    const arrayBuffer = await file.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

    if (originalDurationEl) originalDurationEl.textContent = formatMediaTime(decodedBuffer.duration);
    updateSpeedDisplays();

    if (workspace) workspace.classList.remove('hidden');
    if (processBtn) processBtn.removeAttribute('disabled');
    showToast('Audio loaded! Adjust speed slider or pick a preset', 'success');
  }

  speedSlider?.addEventListener('input', updateSpeedDisplays);

  // Preset buttons
  document.querySelectorAll<HTMLButtonElement>('[data-speed-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const spd = btn.getAttribute('data-speed-preset');
      if (spd && speedSlider) {
        speedSlider.value = spd;
        updateSpeedDisplays();
      }
    });
  });

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadAudio(file);
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
    if (file) loadAudio(file);
  });

  processBtn?.addEventListener('click', async () => {
    if (!decodedBuffer || !originalFile) return;

    const speed = parseFloat(speedSlider?.value || '1.0');
    const targetDuration = decodedBuffer.duration / speed;
    const sampleRate = decodedBuffer.sampleRate;
    const totalFrames = Math.ceil(targetDuration * sampleRate);

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '25%';
    if (progressText) progressText.textContent = `Rendering audio at ${speed}x speed...`;

    const offlineCtx = new OfflineAudioContext(decodedBuffer.numberOfChannels, totalFrames, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.playbackRate.value = speed;
    source.connect(offlineCtx.destination);
    source.start(0);

    if (progressBar) progressBar.style.width = '65%';
    if (progressText) progressText.textContent = 'Processing audio frames...';

    const rendered = await offlineCtx.startRendering();

    if (progressBar) progressBar.style.width = '90%';
    if (progressText) progressText.textContent = 'Encoding output file...';

    const wavBytes = audioBufferToWav(rendered);
    processedBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Speed change complete!';
    setTimeout(() => {
      if (progressWrap) progressWrap.classList.add('hidden');
    }, 500);

    if (downloadBtn) {
      downloadBtn.classList.remove('hidden');
      downloadBtn.removeAttribute('disabled');
    }
    showToast(`Speed changed to ${speed}x! Ready to download`, 'success');
  });

  downloadBtn?.addEventListener('click', () => {
    if (!processedBlob || !originalFile) return;
    const speed = parseFloat(speedSlider?.value || '1.0');
    const base = originalFile.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(processedBlob);
    a.download = `${base}-${speed}x.wav`;
    a.click();
    showToast('Modified audio downloaded!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudioSpeedChanger);
} else {
  initAudioSpeedChanger();
}
