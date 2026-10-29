import { formatMediaTime, audioBufferToWav } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initAudioConverter(): void {
  const dropzone = document.getElementById('ac-dropzone');
  const fileInput = document.getElementById('ac-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('ac-workspace');
  const fileNameEl = document.getElementById('ac-file-name');
  const fileSizeEl = document.getElementById('ac-file-size');
  const durationEl = document.getElementById('ac-duration');

  const formatSelect = document.getElementById('ac-format') as HTMLSelectElement | null;
  const sampleRateSelect = document.getElementById('ac-sample-rate') as HTMLSelectElement | null;
  const channelsSelect = document.getElementById('ac-channels') as HTMLSelectElement | null;

  const convertBtn = document.getElementById('ac-convert-btn') as HTMLButtonElement | null;
  const progressWrap = document.getElementById('ac-progress-wrap');
  const progressBar = document.getElementById('ac-progress-bar');
  const progressText = document.getElementById('ac-progress-text');

  const resultCard = document.getElementById('ac-result-card');
  const audioPreview = document.getElementById('ac-audio-player') as HTMLAudioElement | null;
  const resultSizeEl = document.getElementById('ac-result-size');
  const downloadBtn = document.getElementById('ac-download-btn') as HTMLButtonElement | null;

  let originalFile: File | null = null;
  let decodedBuffer: AudioBuffer | null = null;
  let convertedBlob: Blob | null = null;

  async function loadAudio(file: File) {
    originalFile = file;
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

    const arrayBuffer = await file.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

    if (durationEl) durationEl.textContent = formatMediaTime(decodedBuffer.duration);
    if (workspace) workspace.classList.remove('hidden');
    if (resultCard) resultCard.classList.add('hidden');
    if (convertBtn) convertBtn.removeAttribute('disabled');
    showToast('Audio loaded! Choose output format and sample rate', 'success');
  }

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

  convertBtn?.addEventListener('click', async () => {
    if (!decodedBuffer || !originalFile) return;

    const targetFormat = formatSelect?.value || 'wav';
    const targetSampleRate = parseInt(sampleRateSelect?.value || '44100', 10);
    const targetChannels = parseInt(channelsSelect?.value || '2', 10);

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '30%';
    if (progressText) progressText.textContent = `Resampling to ${targetSampleRate} Hz (${targetChannels === 2 ? 'Stereo' : 'Mono'})...`;

    // Resample via OfflineAudioContext
    const totalFrames = Math.ceil(decodedBuffer.duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(targetChannels, totalFrames, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    if (progressBar) progressBar.style.width = '65%';
    if (progressText) progressText.textContent = 'Rendering audio channels...';

    const renderedBuffer = await offlineCtx.startRendering();

    if (progressBar) progressBar.style.width = '90%';
    if (progressText) progressText.textContent = `Encoding into .${targetFormat}...`;

    const wavBytes = audioBufferToWav(renderedBuffer);
    const mime = targetFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
    convertedBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: mime });

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Conversion complete!';
    setTimeout(() => {
      if (progressWrap) progressWrap.classList.add('hidden');
    }, 500);

    if (audioPreview) audioPreview.src = URL.createObjectURL(convertedBlob);
    if (resultSizeEl) resultSizeEl.textContent = formatBytes(convertedBlob.size);
    if (resultCard) resultCard.classList.remove('hidden');
    showToast(`Converted to ${targetFormat.toUpperCase()} successfully!`, 'success');
  });

  downloadBtn?.addEventListener('click', () => {
    if (!convertedBlob || !originalFile) return;
    const targetFormat = formatSelect?.value || 'wav';
    const base = originalFile.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(convertedBlob);
    a.download = `${base}-converted.${targetFormat}`;
    a.click();
    showToast('Converted audio file downloaded!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudioConverter);
} else {
  initAudioConverter();
}
