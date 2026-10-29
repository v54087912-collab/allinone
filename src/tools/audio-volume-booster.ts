/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encodeWavBlob } from '../utils/mediaAudioUtils.ts';

export function initAudioVolumeBooster(): void {
  const fileInput = document.getElementById('audio-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('audio-drop-zone') as HTMLDivElement | null;
  const boostSlider = document.getElementById('boost-slider') as HTMLInputElement | null;
  const boostValue = document.getElementById('boost-value') as HTMLSpanElement | null;
  const boostBtn = document.getElementById('boost-btn') as HTMLButtonElement | null;
  const audioInfo = document.getElementById('audio-info') as HTMLDivElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;

  let currentFile: File | null = null;
  let audioContext: AudioContext | null = null;

  if (boostSlider && boostValue) {
    boostSlider.addEventListener('input', () => {
      boostValue.textContent = `${boostSlider.value}% (+${(((parseFloat(boostSlider.value) - 100) / 100) * 12).toFixed(1)} dB)`;
    });
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        currentFile = fileInput.files[0];
        if (audioInfo) {
          audioInfo.textContent = `${currentFile.name} (${(currentFile.size / 1024).toFixed(1)} KB)`;
          audioInfo.classList.remove('hidden');
        }
        if (boostBtn) boostBtn.disabled = false;
      }
    });
  }

  if (boostBtn) {
    boostBtn.addEventListener('click', async () => {
      if (!currentFile) return;
      if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      boostBtn.disabled = true;
      boostBtn.textContent = 'Boosting Audio Gain...';

      try {
        const arr = await currentFile.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arr);
        const multiplier = parseFloat(boostSlider?.value || '200') / 100;

        const boostedChannels: Float32Array[] = [];
        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
          const original = buffer.getChannelData(ch);
          const boosted = new Float32Array(original.length);
          for (let i = 0; i < original.length; i++) {
            // Apply soft-knee tanh compression to prevent harsh digital clipping
            const rawVal = original[i] * multiplier;
            boosted[i] = Math.tanh(rawVal);
          }
          boostedChannels.push(boosted);
        }

        const wavBlob = encodeWavBlob(boostedChannels, buffer.sampleRate, buffer.numberOfChannels);
        const outUrl = URL.createObjectURL(wavBlob);

        if (downloadLink) {
          const baseName = currentFile.name.replace(/\.[^/.]+$/, '') || 'boosted_audio';
          downloadLink.href = outUrl;
          downloadLink.download = `${baseName}_boosted_${boostSlider?.value}pct.wav`;
          downloadLink.textContent = `Download Boosted Audio (${boostSlider?.value}%)`;
        }
        if (downloadContainer) downloadContainer.classList.remove('hidden');
      } catch (err: any) {
        alert('Error boosting volume: ' + (err.message || 'Failed to decode'));
      } finally {
        boostBtn.disabled = false;
        boostBtn.textContent = 'Boost & Export Audio';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initAudioVolumeBooster);
