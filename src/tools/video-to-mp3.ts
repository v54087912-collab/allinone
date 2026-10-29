import { formatMediaTime, audioBufferToWav } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initVideoToMp3(): void {
  const dropzone = document.getElementById('v2m-dropzone');
  const fileInput = document.getElementById('v2m-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('v2m-workspace');
  const fileNameEl = document.getElementById('v2m-file-name');
  const fileSizeEl = document.getElementById('v2m-file-size');
  const durationEl = document.getElementById('v2m-duration');
  const totalTimeEl = document.getElementById('v2m-total-time');
  const currentTimeEl = document.getElementById('v2m-current-time');
  const formatSelect = document.getElementById('v2m-format') as HTMLSelectElement | null;
  const waveformCanvas = document.getElementById('v2m-waveform') as HTMLCanvasElement | null;
  const audioPreview = document.getElementById('v2m-audio-player') as HTMLAudioElement | null;

  const playBtn = document.getElementById('v2m-play-btn') as HTMLButtonElement | null;
  const stopBtn = document.getElementById('v2m-stop-btn') as HTMLButtonElement | null;
  const rewindBtn = document.getElementById('v2m-rewind-btn') as HTMLButtonElement | null;
  const forwardBtn = document.getElementById('v2m-forward-btn') as HTMLButtonElement | null;
  const seekBar = document.getElementById('v2m-seek-bar') as HTMLInputElement | null;
  const volumeSlider = document.getElementById('v2m-volume-slider') as HTMLInputElement | null;
  const speedBtns = document.querySelectorAll<HTMLButtonElement>('.v2m-speed-btn');

  const downloadBtn = document.getElementById('v2m-download-btn') as HTMLButtonElement | null;
  const progressWrap = document.getElementById('v2m-progress-wrap');
  const progressBar = document.getElementById('v2m-progress-bar');
  const progressText = document.getElementById('v2m-progress-text');

  let loadedAudioBuffer: AudioBuffer | null = null;
  let originalBaseName = 'extracted-audio';
  let isSeeking = false;

  function drawWaveform(buffer: AudioBuffer, playheadRatio = 0) {
    if (!waveformCanvas) return;
    const ctx = waveformCanvas.getContext('2d');
    if (!ctx) return;

    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    ctx.clearRect(0, 0, width, height);

    // Deep sleek background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2.2;

    const playheadX = playheadRatio * width;

    // Draw bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y = Math.max(3, (max - min) * amp);

      // Played vs Unplayed coloration
      if (i <= playheadX) {
        ctx.fillStyle = '#38bdf8'; // bright sky blue for played
      } else {
        ctx.fillStyle = '#334155'; // muted slate for unplayed
      }
      ctx.fillRect(i, (height - y) / 2, 1, y);
    }

    // Glowing playhead indicator line
    if (playheadRatio > 0 && playheadRatio <= 1) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }

  function updatePlayerProgress() {
    if (!audioPreview || isSeeking) return;
    const current = audioPreview.currentTime;
    const dur = audioPreview.duration || (loadedAudioBuffer ? loadedAudioBuffer.duration : 1);

    if (currentTimeEl) currentTimeEl.textContent = formatMediaTime(current);
    if (totalTimeEl) totalTimeEl.textContent = formatMediaTime(dur);

    if (seekBar) {
      seekBar.value = String((current / dur) * 100);
    }

    if (loadedAudioBuffer) {
      drawWaveform(loadedAudioBuffer, dur > 0 ? current / dur : 0);
    }
  }

  async function processVideo(file: File) {
    originalBaseName = file.name.replace(/\.[^/.]+$/, '');
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '25%';
    if (progressText) progressText.textContent = 'Reading video file...';

    try {
      const arrayBuffer = await file.arrayBuffer();
      if (progressBar) progressBar.style.width = '55%';
      if (progressText) progressText.textContent = 'Decoding audio stream...';

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      loadedAudioBuffer = decodedBuffer;

      const durFormatted = formatMediaTime(decodedBuffer.duration);
      if (durationEl) durationEl.textContent = durFormatted;
      if (totalTimeEl) totalTimeEl.textContent = durFormatted;
      if (currentTimeEl) currentTimeEl.textContent = '00:00';

      drawWaveform(decodedBuffer, 0);

      // Convert to WAV for immediate in-browser playback
      const wavBytes = audioBufferToWav(decodedBuffer);
      const audioBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioPreview) {
        audioPreview.src = audioUrl;
        audioPreview.currentTime = 0;
      }

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Audio extracted successfully!';
      setTimeout(() => {
        if (progressWrap) progressWrap.classList.add('hidden');
      }, 500);

      if (workspace) workspace.classList.remove('hidden');
      if (downloadBtn) downloadBtn.removeAttribute('disabled');
      showToast('Audio extracted! Use the player below to listen or seek', 'success');
    } catch (err) {
      console.error(err);
      if (progressText) progressText.textContent = 'Failed to extract audio. Ensure video contains an audio track.';
      showToast('Error extracting audio from video', 'error');
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
      processVideo(file);
      fileInput.value = '';
    }
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
    if (file) processVideo(file);
  });

  // Play / Pause Toggle
  playBtn?.addEventListener('click', () => {
    if (!audioPreview || !audioPreview.src) return;
    if (audioPreview.paused) {
      audioPreview.play();
      playBtn.textContent = '⏸';
      playBtn.classList.replace('bg-blue-600', 'bg-amber-600');
    } else {
      audioPreview.pause();
      playBtn.textContent = '▶';
      playBtn.classList.replace('bg-amber-600', 'bg-blue-600');
    }
  });

  // Stop button
  stopBtn?.addEventListener('click', () => {
    if (!audioPreview) return;
    audioPreview.pause();
    audioPreview.currentTime = 0;
    if (playBtn) {
      playBtn.textContent = '▶';
      playBtn.classList.replace('bg-amber-600', 'bg-blue-600');
    }
    updatePlayerProgress();
  });

  // Rewind & Forward
  rewindBtn?.addEventListener('click', () => {
    if (!audioPreview) return;
    audioPreview.currentTime = Math.max(0, audioPreview.currentTime - 5);
    updatePlayerProgress();
  });

  forwardBtn?.addEventListener('click', () => {
    if (!audioPreview) return;
    audioPreview.currentTime = Math.min(audioPreview.duration || 1000, audioPreview.currentTime + 5);
    updatePlayerProgress();
  });

  // Seekbar interaction
  seekBar?.addEventListener('input', () => {
    isSeeking = true;
    if (!audioPreview || !audioPreview.duration) return;
    const pct = parseFloat(seekBar.value);
    const targetTime = (pct / 100) * audioPreview.duration;
    if (currentTimeEl) currentTimeEl.textContent = formatMediaTime(targetTime);
    if (loadedAudioBuffer) {
      drawWaveform(loadedAudioBuffer, pct / 100);
    }
  });

  seekBar?.addEventListener('change', () => {
    if (!audioPreview || !audioPreview.duration) return;
    const pct = parseFloat(seekBar.value);
    audioPreview.currentTime = (pct / 100) * audioPreview.duration;
    isSeeking = false;
  });

  // Interactive Waveform click-to-seek
  waveformCanvas?.addEventListener('click', (e) => {
    if (!audioPreview || !audioPreview.duration || !waveformCanvas) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));

    audioPreview.currentTime = ratio * audioPreview.duration;
    updatePlayerProgress();
    if (loadedAudioBuffer) drawWaveform(loadedAudioBuffer, ratio);
  });

  // Volume slider
  volumeSlider?.addEventListener('input', () => {
    if (audioPreview && volumeSlider) {
      audioPreview.volume = parseFloat(volumeSlider.value);
    }
  });

  // Speed buttons
  speedBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed || '1.0');
      if (audioPreview) audioPreview.playbackRate = speed;
      speedBtns.forEach((b) => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('text-slate-400');
    });
  });

  // Audio preview playback events
  audioPreview?.addEventListener('timeupdate', updatePlayerProgress);
  audioPreview?.addEventListener('ended', () => {
    if (playBtn) {
      playBtn.textContent = '▶';
      playBtn.classList.replace('bg-amber-600', 'bg-blue-600');
    }
    if (loadedAudioBuffer) drawWaveform(loadedAudioBuffer, 0);
  });

  // Download converted audio
  downloadBtn?.addEventListener('click', () => {
    if (!loadedAudioBuffer) return;
    const targetFormat = formatSelect?.value || 'mp3';
    const wavBytes = audioBufferToWav(loadedAudioBuffer);

    const mime = targetFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
    const blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${originalBaseName}.${targetFormat}`;
    a.click();
    showToast(`Audio downloaded as .${targetFormat}!`, 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoToMp3);
} else {
  initVideoToMp3();
}
