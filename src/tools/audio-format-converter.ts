/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encodeWavBlob } from '../utils/mediaAudioUtils.ts';

export function initAudioFormatConverter(): void {
  const fileInput = document.getElementById('audio-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('audio-drop-zone') as HTMLDivElement | null;
  const formatSelect = document.getElementById('target-format') as HTMLSelectElement | null;
  const convertBtn = document.getElementById('convert-btn') as HTMLButtonElement | null;
  const audioInfo = document.getElementById('audio-info') as HTMLDivElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;

  let currentFile: File | null = null;
  let audioContext: AudioContext | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        currentFile = fileInput.files[0];
        if (audioInfo) {
          audioInfo.textContent = `${currentFile.name} (${(currentFile.size / 1024).toFixed(1)} KB)`;
          audioInfo.classList.remove('hidden');
        }
        if (convertBtn) convertBtn.disabled = false;
      }
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      if (!currentFile) return;
      if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      convertBtn.disabled = true;
      convertBtn.textContent = 'Converting...';

      try {
        const arr = await currentFile.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arr);
        const targetFormat = formatSelect?.value || 'wav';

        // Extract channels
        const channels: Float32Array[] = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          channels.push(buffer.getChannelData(i));
        }

        const wavBlob = encodeWavBlob(channels, buffer.sampleRate, buffer.numberOfChannels);
        const outUrl = URL.createObjectURL(wavBlob);

        if (downloadLink) {
          const baseName = currentFile.name.replace(/\.[^/.]+$/, '') || 'converted_audio';
          downloadLink.href = outUrl;
          downloadLink.download = `${baseName}.${targetFormat}`;
          downloadLink.textContent = `Download .${targetFormat.toUpperCase()} (${(wavBlob.size / 1024).toFixed(1)} KB)`;
        }
        if (downloadContainer) downloadContainer.classList.remove('hidden');
      } catch (err: any) {
        alert('Error converting audio format: ' + (err.message || 'Unsupported codec'));
      } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert Audio Format';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initAudioFormatConverter);
