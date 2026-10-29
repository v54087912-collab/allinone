/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { traceImageDataToSvg } from '../utils/vectorDesignUtils.ts';

export function initPngToSvg(): void {
  const fileInput = document.getElementById('image-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('image-drop-zone') as HTMLDivElement | null;
  const simplifySlider = document.getElementById('simplify-slider') as HTMLInputElement | null;
  const vectorizeBtn = document.getElementById('vectorize-btn') as HTMLButtonElement | null;
  const svgPreview = document.getElementById('svg-output-preview') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;

  let loadedImg: HTMLImageElement | null = null;
  let currentFile: File | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        currentFile = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            loadedImg = img;
            if (vectorizeBtn) vectorizeBtn.disabled = false;
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(currentFile);
      }
    });
  }

  if (vectorizeBtn) {
    vectorizeBtn.addEventListener('click', () => {
      if (!loadedImg) return;

      const canvas = document.createElement('canvas');
      // Limit resolution for fast in-browser vectorization
      const maxDim = 250;
      const scale = Math.min(1, maxDim / Math.max(loadedImg.width, loadedImg.height));
      canvas.width = Math.round(loadedImg.width * scale);
      canvas.height = Math.round(loadedImg.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const groupSize = parseInt(simplifySlider?.value || '32');
      const svgCode = traceImageDataToSvg(imageData, groupSize);

      if (svgPreview) svgPreview.innerHTML = svgCode;

      const blob = new Blob([svgCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      if (downloadLink) {
        const base = currentFile?.name.replace(/\.[^/.]+$/, '') || 'vectorized';
        downloadLink.href = url;
        downloadLink.download = `${base}.svg`;
        downloadLink.textContent = 'Download Vector SVG';
      }
      if (downloadContainer) downloadContainer.classList.remove('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', initPngToSvg);
