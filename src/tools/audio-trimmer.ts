import { formatMediaTime, audioBufferToWav, calculateSliceFrameRange } from '../utils/mediaUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initAudioTrimmer(): void {
  const dropzone = document.getElementById('at-dropzone');
  const fileInput = document.getElementById('at-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('at-workspace');
  const fileNameEl = document.getElementById('at-file-name');
  const fileSizeEl = document.getElementById('at-file-size');
  const totalDurationEl = document.getElementById('at-total-duration');
  const cutDurationEl = document.getElementById('at-cut-duration');
  const currentTimeEl = document.getElementById('at-current-time');
  const totalTimeEl = document.getElementById('at-total-time');

  const waveformCanvas = document.getElementById('at-waveform') as HTMLCanvasElement | null;
  const seekBar = document.getElementById('at-seek-bar') as HTMLInputElement | null;
  const playBtn = document.getElementById('at-play-btn') as HTMLButtonElement | null;
  const playSelectionBtn = document.getElementById('at-play-selection-btn') as HTMLButtonElement | null;
  const stopBtn = document.getElementById('at-stop-btn') as HTMLButtonElement | null;
  const rewindBtn = document.getElementById('at-rewind-btn') as HTMLButtonElement | null;
  const forwardBtn = document.getElementById('at-forward-btn') as HTMLButtonElement | null;
  const volumeSlider = document.getElementById('at-volume-slider') as HTMLInputElement | null;

  const startInput = document.getElementById('at-start-time') as HTMLInputElement | null;
  const startSlider = document.getElementById('at-start-slider') as HTMLInputElement | null;
  const setStartBtn = document.getElementById('at-set-start-btn') as HTMLButtonElement | null;

  const endInput = document.getElementById('at-end-time') as HTMLInputElement | null;
  const endSlider = document.getElementById('at-end-slider') as HTMLInputElement | null;
  const setEndBtn = document.getElementById('at-set-end-btn') as HTMLButtonElement | null;

  const formatSelect = document.getElementById('at-format') as HTMLSelectElement | null;
  const downloadBtn = document.getElementById('at-download-btn') as HTMLButtonElement | null;

  let loadedAudioBuffer: AudioBuffer | null = null;
  let audioContext: AudioContext | null = null;
  let activeSourceNode: AudioBufferSourceNode | null = null;
  let gainNode: GainNode | null = null;

  let playbackStartTime = 0;
  let playbackStartOffset = 0;
  let playbackTimer: number | null = null;
  let isPlaying = false;
  let originalBaseName = 'trimmed-audio';

  function getAudioCtx(): AudioContext {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
    }
    return audioContext;
  }

  function getCurrentPlayheadTime(): number {
    if (!loadedAudioBuffer) return 0;
    if (isPlaying && audioContext) {
      const elapsed = audioContext.currentTime - playbackStartTime;
      return Math.min(loadedAudioBuffer.duration, playbackStartOffset + elapsed);
    }
    return playbackStartOffset;
  }

  function drawWaveform(playheadTime: number = getCurrentPlayheadTime()) {
    if (!waveformCanvas || !loadedAudioBuffer) return;
    const ctx = waveformCanvas.getContext('2d');
    if (!ctx) return;

    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const channelData = loadedAudioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2.3;

    const duration = loadedAudioBuffer.duration;
    const startSec = parseFloat(startInput?.value || '0');
    const endSec = parseFloat(endInput?.value || String(duration));

    const startX = (startSec / duration) * width;
    const endX = (endSec / duration) * width;
    const playheadX = (playheadTime / duration) * width;

    // Background selection shading
    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.fillRect(startX, 0, Math.max(1, endX - startX), height);

    // Draw audio wave bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y = Math.max(3, (max - min) * amp);

      // Highlight selected cut region vs unselected
      if (i >= startX && i <= endX) {
        ctx.fillStyle = i <= playheadX ? '#818cf8' : '#6366f1';
      } else {
        ctx.fillStyle = '#334155';
      }
      ctx.fillRect(i, (height - y) / 2, 1, y);
    }

    // Selection boundaries (Left & Right markers)
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // Moving playhead indicator line
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }

  function syncTimes(fromSource: 'startInput' | 'endInput' | 'startSlider' | 'endSlider') {
    if (!loadedAudioBuffer) return;
    const duration = loadedAudioBuffer.duration;

    let start = parseFloat(startInput?.value || '0');
    let end = parseFloat(endInput?.value || String(duration));

    if (fromSource === 'startSlider' && startSlider) {
      start = (parseFloat(startSlider.value) / 100) * duration;
    } else if (fromSource === 'endSlider' && endSlider) {
      end = (parseFloat(endSlider.value) / 100) * duration;
    }

    if (start < 0) start = 0;
    if (end > duration) end = duration;
    if (start >= end) {
      if (fromSource.includes('start')) {
        start = Math.max(0, end - 0.2);
      } else {
        end = Math.min(duration, start + 0.2);
      }
    }

    if (startInput) startInput.value = start.toFixed(1);
    if (endInput) endInput.value = end.toFixed(1);

    if (startSlider) startSlider.value = String((start / duration) * 100);
    if (endSlider) endSlider.value = String((end / duration) * 100);

    if (cutDurationEl) cutDurationEl.textContent = formatMediaTime(end - start, true);
    drawWaveform();
  }

  function startPlayback(offset: number, durationLimit?: number) {
    if (!loadedAudioBuffer) return;
    const ctx = getAudioCtx();

    stopPlayback(false);

    const source = ctx.createBufferSource();
    source.buffer = loadedAudioBuffer;
    if (gainNode) source.connect(gainNode);

    playbackStartTime = ctx.currentTime;
    playbackStartOffset = offset;
    isPlaying = true;

    if (durationLimit) {
      source.start(0, offset, durationLimit);
    } else {
      source.start(0, offset);
    }
    activeSourceNode = source;

    if (playBtn) playBtn.textContent = '⏸ Pause';

    source.onended = () => {
      stopPlayback(false);
    };

    if (playbackTimer) clearInterval(playbackTimer);
    playbackTimer = window.setInterval(() => {
      const cur = getCurrentPlayheadTime();
      if (currentTimeEl) currentTimeEl.textContent = formatMediaTime(cur, true);
      if (seekBar && loadedAudioBuffer) {
        seekBar.value = String((cur / loadedAudioBuffer.duration) * 100);
      }
      drawWaveform(cur);
    }, 40);
  }

  function stopPlayback(resetToZero = true) {
    if (activeSourceNode) {
      try {
        activeSourceNode.stop();
        activeSourceNode.disconnect();
      } catch (e) {}
      activeSourceNode = null;
    }
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
    isPlaying = false;
    if (playBtn) playBtn.textContent = '▶ Play All';
    if (playSelectionBtn) playSelectionBtn.textContent = '⚡ Play Selection';

    if (resetToZero) {
      playbackStartOffset = 0;
      if (currentTimeEl) currentTimeEl.textContent = '00:00.0';
      if (seekBar) seekBar.value = '0';
      drawWaveform(0);
    } else {
      drawWaveform(getCurrentPlayheadTime());
    }
  }

  async function loadAudio(file: File) {
    originalBaseName = file.name.replace(/\.[^/.]+$/, '');
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

    const arrayBuffer = await file.arrayBuffer();
    const ctx = getAudioCtx();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    loadedAudioBuffer = buffer;

    const formattedDur = formatMediaTime(buffer.duration);
    if (totalDurationEl) totalDurationEl.textContent = formattedDur;
    if (totalTimeEl) totalTimeEl.textContent = formatMediaTime(buffer.duration, true);
    if (currentTimeEl) currentTimeEl.textContent = '00:00.0';

    if (startInput) {
      startInput.max = buffer.duration.toFixed(1);
      startInput.value = '0.0';
    }
    if (endInput) {
      endInput.max = buffer.duration.toFixed(1);
      endInput.value = buffer.duration.toFixed(1);
    }

    if (workspace) workspace.classList.remove('hidden');
    if (downloadBtn) downloadBtn.removeAttribute('disabled');
    if (playBtn) playBtn.removeAttribute('disabled');

    syncTimes('startInput');
    showToast('Audio loaded! Drag sliders or use playhead to set markers', 'success');
  }

  // Dropzone click opens file picker
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput?.click();
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      loadAudio(file);
      fileInput.value = '';
    }
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-indigo-500');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-indigo-500'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-indigo-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadAudio(file);
  });

  // Play / Pause Whole Audio
  playBtn?.addEventListener('click', () => {
    if (!loadedAudioBuffer) return;
    if (isPlaying) {
      stopPlayback(false);
    } else {
      startPlayback(playbackStartOffset);
    }
  });

  // Play Selection Only
  playSelectionBtn?.addEventListener('click', () => {
    if (!loadedAudioBuffer) return;
    const start = parseFloat(startInput?.value || '0');
    const end = parseFloat(endInput?.value || String(loadedAudioBuffer.duration));
    const durationLimit = Math.max(0.1, end - start);
    startPlayback(start, durationLimit);
    if (playSelectionBtn) playSelectionBtn.textContent = '⏸ Pause';
  });

  // Stop button
  stopBtn?.addEventListener('click', () => stopPlayback(true));

  // Rewind / Forward
  rewindBtn?.addEventListener('click', () => {
    if (!loadedAudioBuffer) return;
    const cur = Math.max(0, getCurrentPlayheadTime() - 5);
    playbackStartOffset = cur;
    if (isPlaying) startPlayback(cur);
    else drawWaveform(cur);
  });

  forwardBtn?.addEventListener('click', () => {
    if (!loadedAudioBuffer) return;
    const cur = Math.min(loadedAudioBuffer.duration, getCurrentPlayheadTime() + 5);
    playbackStartOffset = cur;
    if (isPlaying) startPlayback(cur);
    else drawWaveform(cur);
  });

  // Seekbar dragging
  seekBar?.addEventListener('input', () => {
    if (!loadedAudioBuffer) return;
    const pct = parseFloat(seekBar.value);
    const target = (pct / 100) * loadedAudioBuffer.duration;
    playbackStartOffset = target;
    if (currentTimeEl) currentTimeEl.textContent = formatMediaTime(target, true);
    drawWaveform(target);
  });

  seekBar?.addEventListener('change', () => {
    if (!loadedAudioBuffer) return;
    const pct = parseFloat(seekBar.value);
    const target = (pct / 100) * loadedAudioBuffer.duration;
    if (isPlaying) startPlayback(target);
  });

  // Click on waveform to seek
  waveformCanvas?.addEventListener('click', (e) => {
    if (!loadedAudioBuffer || !waveformCanvas) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * loadedAudioBuffer.duration;

    playbackStartOffset = targetTime;
    if (currentTimeEl) currentTimeEl.textContent = formatMediaTime(targetTime, true);
    if (seekBar) seekBar.value = String(ratio * 100);

    if (isPlaying) {
      startPlayback(targetTime);
    } else {
      drawWaveform(targetTime);
    }
  });

  // Sliders and inputs sync
  startInput?.addEventListener('input', () => syncTimes('startInput'));
  endInput?.addEventListener('input', () => syncTimes('endInput'));
  startSlider?.addEventListener('input', () => syncTimes('startSlider'));
  endSlider?.addEventListener('input', () => syncTimes('endSlider'));

  // Set start & end to playhead
  setStartBtn?.addEventListener('click', () => {
    const cur = getCurrentPlayheadTime();
    if (startInput) startInput.value = cur.toFixed(1);
    syncTimes('startInput');
    showToast(`Start marker set to ${cur.toFixed(1)}s`, 'info');
  });

  setEndBtn?.addEventListener('click', () => {
    const cur = getCurrentPlayheadTime();
    if (endInput) endInput.value = cur.toFixed(1);
    syncTimes('endInput');
    showToast(`End marker set to ${cur.toFixed(1)}s`, 'info');
  });

  // Volume slider
  volumeSlider?.addEventListener('input', () => {
    if (gainNode && volumeSlider) {
      gainNode.gain.value = parseFloat(volumeSlider.value);
    }
  });

  // Export Trimmed Audio
  downloadBtn?.addEventListener('click', () => {
    if (!loadedAudioBuffer) return;
    const ctx = getAudioCtx();
    const duration = loadedAudioBuffer.duration;
    const startSec = parseFloat(startInput?.value || '0');
    const endSec = parseFloat(endInput?.value || String(duration));

    const { startFrame, length } = calculateSliceFrameRange(duration, loadedAudioBuffer.sampleRate, startSec, endSec);
    const trimmedBuffer = ctx.createBuffer(
      loadedAudioBuffer.numberOfChannels,
      length,
      loadedAudioBuffer.sampleRate
    );

    for (let c = 0; c < loadedAudioBuffer.numberOfChannels; c++) {
      const srcChannel = loadedAudioBuffer.getChannelData(c);
      const dstChannel = trimmedBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        dstChannel[i] = srcChannel[startFrame + i] || 0;
      }
    }

    const targetFormat = formatSelect?.value || 'wav';
    const wavBytes = audioBufferToWav(trimmedBuffer);
    const mime = targetFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
    const blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${originalBaseName}-trimmed.${targetFormat}`;
    a.click();
    showToast(`Trimmed audio downloaded as .${targetFormat}!`, 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudioTrimmer);
} else {
  initAudioTrimmer();
}
