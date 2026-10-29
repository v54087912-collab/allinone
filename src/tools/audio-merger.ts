/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encodeWavBlob } from '../utils/mediaAudioUtils.ts';

export function initAudioMerger(): void {
  const fileInput = document.getElementById('audio-files-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('audio-drop-zone') as HTMLDivElement | null;
  const trackList = document.getElementById('track-list') as HTMLUListElement | null;
  const mergeBtn = document.getElementById('merge-btn') as HTMLButtonElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;

  interface TrackItem {
    file: File;
    name: string;
    buffer: AudioBuffer;
  }

  let tracks: TrackItem[] = [];
  let audioContext: AudioContext | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files?.length) return;
      if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      for (let i = 0; i < fileInput.files.length; i++) {
        const f = fileInput.files[i];
        const arr = await f.arrayBuffer();
        try {
          const buf = await audioContext.decodeAudioData(arr);
          tracks.push({ file: f, name: f.name, buffer: buf });
        } catch (e) {
          console.error('Could not decode audio:', f.name);
        }
      }
      renderTracks();
    });
  }

  function renderTracks() {
    if (!trackList) return;
    trackList.innerHTML = '';
    tracks.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60';
      li.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold">${idx + 1}</span>
          <div>
            <div class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">${t.name}</div>
            <div class="text-xs text-slate-500">${t.buffer.duration.toFixed(1)}s • ${t.buffer.numberOfChannels}ch • ${t.buffer.sampleRate}Hz</div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" data-up="${idx}" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${idx === 0 ? 'opacity-20 cursor-not-allowed' : ''}">↑</button>
          <button type="button" data-down="${idx}" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${idx === tracks.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}">↓</button>
          <button type="button" data-remove="${idx}" class="p-1 text-red-500 hover:text-red-700 ml-2">✕</button>
        </div>
      `;
      trackList.appendChild(li);
    });

    if (mergeBtn) mergeBtn.disabled = tracks.length < 2;

    // Attach listeners
    trackList.querySelectorAll<HTMLButtonElement>('[data-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.up || '0');
        if (i > 0) {
          const temp = tracks[i];
          tracks[i] = tracks[i - 1];
          tracks[i - 1] = temp;
          renderTracks();
        }
      });
    });
    trackList.querySelectorAll<HTMLButtonElement>('[data-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.down || '0');
        if (i < tracks.length - 1) {
          const temp = tracks[i];
          tracks[i] = tracks[i + 1];
          tracks[i + 1] = temp;
          renderTracks();
        }
      });
    });
    trackList.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.remove || '0');
        tracks.splice(i, 1);
        renderTracks();
      });
    });
  }

  if (mergeBtn) {
    mergeBtn.addEventListener('click', () => {
      if (tracks.length < 2 || !audioContext) return;

      const targetSampleRate = 44100;
      let totalSamples = 0;
      for (const t of tracks) {
        totalSamples += Math.floor(t.buffer.duration * targetSampleRate);
      }

      // Merge to mono/stereo (interleaved channel array)
      const mergedChannel = new Float32Array(totalSamples);
      let offset = 0;

      for (const t of tracks) {
        const chData = t.buffer.getChannelData(0); // Take channel 0
        const factor = t.buffer.sampleRate / targetSampleRate;
        for (let i = 0; i < Math.floor(t.buffer.duration * targetSampleRate); i++) {
          const srcIdx = Math.floor(i * factor);
          mergedChannel[offset + i] = chData[srcIdx] || 0;
        }
        offset += Math.floor(t.buffer.duration * targetSampleRate);
      }

      const blob = encodeWavBlob([mergedChannel], targetSampleRate, 1);
      const outUrl = URL.createObjectURL(blob);

      if (downloadLink) {
        downloadLink.href = outUrl;
        downloadLink.download = `merged_${tracks.length}_tracks.wav`;
        downloadLink.textContent = `Download Merged Audio (${(totalSamples / targetSampleRate).toFixed(1)}s)`;
      }
      if (downloadContainer) downloadContainer.classList.remove('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', initAudioMerger);
