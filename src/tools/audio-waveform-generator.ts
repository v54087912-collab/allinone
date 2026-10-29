/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractWaveformPeaks } from '../utils/mediaAudioUtils.ts';

export function initAudioWaveformGenerator(): void {
  const fileInput = document.getElementById('audio-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('audio-drop-zone') as HTMLDivElement | null;
  const waveformCanvas = document.getElementById('waveform-canvas') as HTMLCanvasElement | null;
  const waveStyleSelect = document.getElementById('wave-style') as HTMLSelectElement | null;
  const waveColorInput = document.getElementById('wave-color') as HTMLInputElement | null;
  const barCountInput = document.getElementById('bar-count') as HTMLInputElement | null;
  const downloadPngBtn = document.getElementById('download-png') as HTMLButtonElement | null;

  let audioContext: AudioContext | null = null;
  let peaks: number[] = [];

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files?.length) return;
      if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const arr = await fileInput.files[0].arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arr);
      const chData = buffer.getChannelData(0);
      const bars = parseInt(barCountInput?.value || '80');
      peaks = extractWaveformPeaks(chData, bars);
      drawWaveform();
      if (downloadPngBtn) downloadPngBtn.disabled = false;
    });
  }

  function drawWaveform() {
    if (!waveformCanvas || !peaks.length) return;
    const ctx = waveformCanvas.getContext('2d');
    if (!ctx) return;

    const w = waveformCanvas.width;
    const h = waveformCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const color = waveColorInput?.value || '#3b82f6';
    const style = waveStyleSelect?.value || 'bars';
    const barWidth = w / peaks.length;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, barWidth - 2);

    if (style === 'bars') {
      peaks.forEach((p, idx) => {
        const barH = p * h * 0.85;
        const x = idx * barWidth;
        const y = (h - barH) / 2;
        ctx.fillRect(x + 1, y, Math.max(1, barWidth - 2), barH);
      });
    } else if (style === 'mirror') {
      peaks.forEach((p, idx) => {
        const barH = p * (h / 2) * 0.9;
        const x = idx * barWidth;
        ctx.fillRect(x + 1, h / 2 - barH, Math.max(1, barWidth - 2), barH * 2);
      });
    } else {
      // Smooth wave line
      ctx.beginPath();
      ctx.lineWidth = 3;
      peaks.forEach((p, idx) => {
        const x = idx * barWidth + barWidth / 2;
        const y = (h / 2) - (p * (h / 2) * 0.85);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  [waveStyleSelect, waveColorInput, barCountInput].forEach(elem => {
    elem?.addEventListener('input', drawWaveform);
  });

  if (downloadPngBtn && waveformCanvas) {
    downloadPngBtn.addEventListener('click', () => {
      const url = waveformCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audio-waveform.png';
      a.click();
    });
  }
}

document.addEventListener('DOMContentLoaded', initAudioWaveformGenerator);
