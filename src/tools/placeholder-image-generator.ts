/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generatePlaceholderSvg } from '../utils/vectorDesignUtils.ts';

export function initPlaceholderImageGenerator(): void {
  const widthInput = document.getElementById('img-width') as HTMLInputElement | null;
  const heightInput = document.getElementById('img-height') as HTMLInputElement | null;
  const textInput = document.getElementById('img-text') as HTMLInputElement | null;
  const bgColorInput = document.getElementById('bg-color') as HTMLInputElement | null;
  const textColorInput = document.getElementById('text-color') as HTMLInputElement | null;
  const previewContainer = document.getElementById('preview-container') as HTMLDivElement | null;
  const downloadSvgBtn = document.getElementById('download-svg-btn') as HTMLButtonElement | null;
  const downloadPngBtn = document.getElementById('download-png-btn') as HTMLButtonElement | null;

  function update() {
    const w = Math.max(50, Math.min(2000, parseInt(widthInput?.value || '600')));
    const h = Math.max(50, Math.min(2000, parseInt(heightInput?.value || '400')));
    const text = textInput?.value || `${w} × ${h}`;
    const bg = bgColorInput?.value || '#cbd5e1';
    const fg = textColorInput?.value || '#475569';

    const svg = generatePlaceholderSvg(w, h, text, bg, fg);
    if (previewContainer) {
      previewContainer.innerHTML = svg;
    }
  }

  [widthInput, heightInput, textInput, bgColorInput, textColorInput].forEach(el => el?.addEventListener('input', update));

  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      const w = parseInt(widthInput?.value || '600');
      const h = parseInt(heightInput?.value || '400');
      const svg = generatePlaceholderSvg(w, h, textInput?.value, bgColorInput?.value, textColorInput?.value);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placeholder-${w}x${h}.svg`;
      a.click();
    });
  }

  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', () => {
      const w = parseInt(widthInput?.value || '600');
      const h = parseInt(heightInput?.value || '400');
      const svg = generatePlaceholderSvg(w, h, textInput?.value, bgColorInput?.value, textColorInput?.value);

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `placeholder-${w}x${h}.png`;
          a.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initPlaceholderImageGenerator);
