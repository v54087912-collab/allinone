/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initLogoResizer(): void {
  const fileInput = document.getElementById('logo-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('logo-drop-zone') as HTMLDivElement | null;
  const presetsContainer = document.getElementById('presets-grid') as HTMLDivElement | null;
  const previewImg = document.getElementById('logo-preview') as HTMLImageElement | null;

  interface LogoPreset {
    name: string;
    width: number;
    height: number;
    category: string;
  }

  const presets: LogoPreset[] = [
    { name: 'Favicon 16x16', width: 16, height: 16, category: 'Web' },
    { name: 'Favicon 32x32', width: 32, height: 32, category: 'Web' },
    { name: 'Apple Touch 180x180', width: 180, height: 180, category: 'Mobile' },
    { name: 'Android Icon 192x192', width: 192, height: 192, category: 'Mobile' },
    { name: 'PWA Icon 512x512', width: 512, height: 512, category: 'Mobile' },
    { name: 'Twitter / X Avatar 400x400', width: 400, height: 400, category: 'Social' },
    { name: 'Instagram Profile 320x320', width: 320, height: 320, category: 'Social' },
    { name: 'YouTube Channel Icon 800x800', width: 800, height: 800, category: 'Social' }
  ];

  let currentImg: HTMLImageElement | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            currentImg = img;
            if (previewImg) {
              previewImg.src = img.src;
              previewImg.classList.remove('hidden');
            }
            renderPresets();
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function renderPresets() {
    if (!presetsContainer || !currentImg) return;
    presetsContainer.innerHTML = '';
    presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">${p.category}</span>
          <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">${p.name}</h4>
          <span class="text-[11px] text-slate-400">${p.width} × ${p.height} px</span>
        </div>
        <button type="button" data-preset="${p.width}x${p.height}" class="mt-3 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">Export PNG</button>
      `;
      card.querySelector('button')?.addEventListener('click', () => downloadResized(p.width, p.height, p.name));
      presetsContainer.appendChild(card);
    });
  }

  function downloadResized(w: number, h: number, name: string) {
    if (!currentImg) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw scaled containing aspect ratio
    const scale = Math.min(w / currentImg.width, h / currentImg.height);
    const dW = currentImg.width * scale;
    const dH = currentImg.height * scale;
    const dX = (w - dW) / 2;
    const dY = (h - dH) / 2;

    ctx.drawImage(currentImg, dX, dY, dW, dH);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    a.click();
  }
}

document.addEventListener('DOMContentLoaded', initLogoResizer);
