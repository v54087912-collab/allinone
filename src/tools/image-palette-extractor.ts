/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractDominantColorsFromPixels } from '../utils/colorPickerUtils.ts';

export function initImagePaletteExtractor(): void {
  const fileInput = document.getElementById('image-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('image-drop-zone') as HTMLDivElement | null;
  const imagePreview = document.getElementById('image-preview') as HTMLImageElement | null;
  const swatchesContainer = document.getElementById('swatches-container') as HTMLDivElement | null;
  const copyAllBtn = document.getElementById('copy-all-btn') as HTMLButtonElement | null;

  let currentColors: string[] = [];

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        processImage(fileInput.files[0]);
      }
    });
  }

  function processImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (imagePreview) {
          imagePreview.src = img.src;
          imagePreview.classList.remove('hidden');
        }

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 100, 100);
        const data = ctx.getImageData(0, 0, 100, 100).data;

        // Sample dominant colors
        const dominant = extractDominantColorsFromPixels(data, 6);
        currentColors = dominant.map(d => d.hex);
        renderSwatches();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function renderSwatches() {
    if (!swatchesContainer) return;
    swatchesContainer.innerHTML = '';
    currentColors.forEach(hex => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-2xl flex flex-col items-center justify-between h-36 cursor-pointer hover:scale-105 transition-all shadow-xs';
      card.style.backgroundColor = hex;
      card.innerHTML = `
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white">Click to copy</span>
        <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/60 text-white uppercase">${hex}</span>
      `;
      card.addEventListener('click', async () => {
        await navigator.clipboard.writeText(hex);
        card.querySelector('span')!.textContent = 'Copied!';
        setTimeout(() => { card.querySelector('span')!.textContent = 'Click to copy'; }, 1200);
      });
      swatchesContainer.appendChild(card);
    });

    if (copyAllBtn) copyAllBtn.disabled = currentColors.length === 0;
  }

  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(currentColors.join(', '));
      copyAllBtn.textContent = 'Copied All!';
      setTimeout(() => { copyAllBtn.textContent = 'Copy All HEX Codes'; }, 1500);
    });
  }
}

document.addEventListener('DOMContentLoaded', initImagePaletteExtractor);
