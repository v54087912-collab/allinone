/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encodeWavBlob, formatSecondsToSrtTime } from '../utils/mediaAudioUtils.ts';

export function initAudioCutter(): void {
  const fileInput = document.getElementById('audio-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('audio-drop-zone') as HTMLDivElement | null;
  const audioPlayer = document.getElementById('preview-player') as HTMLAudioElement | null;
  const startTimeInput = document.getElementById('start-time') as HTMLInputElement | null;
  const endTimeInput = document.getElementById('end-time') as HTMLInputElement | null;
  const cutBtn = document.getElementById('cut-btn') as HTMLButtonElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;
  const durationInfo = document.getElementById('duration-info') as HTMLSpanElement | null;

  let audioContext: AudioContext | null = null;
  let decodedBuffer: AudioBuffer | null = null;
  let currentFile: File | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) loadAudio(fileInput.files[0]);
    });
  }

  async function loadAudio(file: File) {
    currentFile = file;
    if (audioPlayer) audioPlayer.src = URL.createObjectURL(file);
    if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const arrayBuffer = await file.arrayBuffer();
    decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (durationInfo) {
      durationInfo.textContent = `Total Length: ${decodedBuffer.duration.toFixed(2)}s (${formatSecondsToSrtTime(decodedBuffer.duration).slice(3, 8)})`;
    }
    if (startTimeInput) {
      startTimeInput.value = '0';
      startTimeInput.max = decodedBuffer.duration.toString();
    }
    if (endTimeInput) {
      endTimeInput.value = decodedBuffer.duration.toFixed(2);
      endTimeInput.max = decodedBuffer.duration.toString();
    }
    if (cutBtn) cutBtn.disabled = false;
  }

  if (cutBtn) {
    cutBtn.addEventListener('click', () => {
      if (!decodedBuffer || !audioContext) return;

      const start = Math.max(0, parseFloat(startTimeInput?.value || '0'));
      const end = Math.min(decodedBuffer.duration, parseFloat(endTimeInput?.value || decodedBuffer.duration.toString()));

      if (start >= end) {
        alert('Start time must be less than end time.');
        return;
      }

      const sampleRate = decodedBuffer.sampleRate;
      const startSample = Math.floor(start * sampleRate);
      const endSample = Math.floor(end * sampleRate);
      const cutLength = endSample - startSample;

      const cutChannelData: Float32Array[] = [];
      for (let ch = 0; ch < decodedBuffer.numberOfChannels; ch++) {
        const fullData = decodedBuffer.getChannelData(ch);
        cutChannelData.push(fullData.subarray(startSample, endSample));
      }

      const wavBlob = encodeWavBlob(cutChannelData, sampleRate, decodedBuffer.numberOfChannels);
      const outUrl = URL.createObjectURL(wavBlob);

      if (downloadLink) {
        const baseName = currentFile?.name.replace(/\.[^/.]+$/, '') || 'cut_audio';
        downloadLink.href = outUrl;
        downloadLink.download = `${baseName}_cut_${start.toFixed(1)}s-${end.toFixed(1)}s.wav`;
        downloadLink.textContent = `Download Cut Audio (${((end - start)).toFixed(1)}s)`;
      }
      if (downloadContainer) downloadContainer.classList.remove('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', initAudioCutter);
