/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initSvgToPng(): void {
  const fileInput = document.getElementById('svg-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('svg-drop-zone') as HTMLDivElement | null;
  const scaleSelect = document.getElementById('scale-select') as HTMLSelectElement | null;
  const convertBtn = document.getElementById('convert-btn') as HTMLButtonElement | null;
  const canvas = document.getElementById('render-canvas') as HTMLCanvasElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;

  let svgContent: string | null = null;
  let currentFile: File | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      if (fileInput.files?.length) {
        currentFile = fileInput.files[0];
        svgContent = await currentFile.text();
        if (convertBtn) convertBtn.disabled = false;
      }
    });
  }

  if (convertBtn && canvas) {
    convertBtn.addEventListener('click', () => {
      if (!svgContent) return;

      const scale = parseFloat(scaleSelect?.value || '2');
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const w = (img.width || 400) * scale;
        const h = (img.height || 400) * scale;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const pngUrl = canvas.toDataURL('image/png');
          if (downloadLink) {
            const base = currentFile?.name.replace(/\.[^/.]+$/, '') || 'render';
            downloadLink.href = pngUrl;
            downloadLink.download = `${base}@${scale}x.png`;
            downloadLink.textContent = `Download PNG (${w} × ${h} px)`;
          }
          if (downloadContainer) downloadContainer.classList.remove('hidden');
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }
}

document.addEventListener('DOMContentLoaded', initSvgToPng);
