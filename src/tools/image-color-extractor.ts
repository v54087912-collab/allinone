import { rgbToHex, rgbToHsl } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('ext-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('ext-drop-zone') as HTMLElement | null;
  const resultsContainer = document.getElementById('ext-results') as HTMLElement | null;
  const previewImg = document.getElementById('ext-preview-img') as HTMLImageElement | null;
  const paletteGrid = document.getElementById('ext-palette-grid') as HTMLElement | null;
  const countSelect = document.getElementById('ext-count-select') as HTMLSelectElement | null;
  const copyAllBtn = document.getElementById('ext-copy-all-btn') as HTMLButtonElement | null;
  const exportCssBtn = document.getElementById('ext-export-css-btn') as HTMLButtonElement | null;
  const exportJsonBtn = document.getElementById('ext-export-json-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !resultsContainer || !paletteGrid) return;

  let currentImg: HTMLImageElement | null = null;
  let extractedColors: { hex: string; r: number; g: number; b: number; count: number }[] = [];

  function extractColors() {
    if (!currentImg) return;
    const canvas = document.createElement('canvas');
    const targetDim = 150;
    const scale = Math.min(targetDim / currentImg.width, targetDim / currentImg.height, 1);
    canvas.width = Math.round(currentImg.width * scale);
    canvas.height = Math.round(currentImg.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap: Record<string, { r: number; g: number; b: number; count: number }> = {};

    // Group colors by quantized bins of 24
    const binSize = 24;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 50) continue; // Skip transparency
      const r = Math.floor(data[i] / binSize) * binSize;
      const g = Math.floor(data[i + 1] / binSize) * binSize;
      const b = Math.floor(data[i + 2] / binSize) * binSize;
      const key = `${r},${g},${b}`;
      if (!colorMap[key]) {
        colorMap[key] = { r, g, b, count: 0 };
      }
      colorMap[key].count++;
    }

    const maxCount = Number(countSelect?.value || 6);
    const sorted = Object.values(colorMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCount);

    extractedColors = sorted.map((c) => ({
      ...c,
      hex: rgbToHex(c.r, c.g, c.b)
    }));

    renderPalette();
  }

  function renderPalette() {
    if (!paletteGrid) return;
    paletteGrid.innerHTML = '';
    const totalSampled = extractedColors.reduce((sum, c) => sum + c.count, 0) || 1;

    extractedColors.forEach((item) => {
      const pct = Math.round((item.count / totalSampled) * 100);
      const isDark = (item.r * 0.299 + item.g * 0.587 + item.b * 0.114) < 128;
      const card = document.createElement('div');
      card.className =
        'p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-32 transition-transform hover:scale-102 cursor-pointer shadow-xs';
      card.style.backgroundColor = item.hex;
      card.style.color = isDark ? '#ffffff' : '#0f172a';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <span class="text-xs font-mono font-bold">${item.hex}</span>
          <span class="text-2xs font-semibold px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-xs">${pct}%</span>
        </div>
        <div>
          <div class="text-2xs opacity-80">RGB(${item.r}, ${item.g}, ${item.b})</div>
          <div class="text-2xs opacity-60 mt-0.5">Click to copy</div>
        </div>
      `;

      card.addEventListener('click', () => {
        navigator.clipboard.writeText(item.hex);
        card.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => card.classList.remove('ring-2', 'ring-blue-500'), 1000);
      });
      paletteGrid.appendChild(card);
    });

    resultsContainer?.classList.remove('hidden');
    dropZone?.classList.add('hidden');
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        if (previewImg) previewImg.src = img.src;
        extractColors();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) loadFile(fileInput.files[0]);
  });

  countSelect?.addEventListener('change', extractColors);

  copyAllBtn?.addEventListener('click', () => {
    const hexes = extractedColors.map((c) => c.hex).join(', ');
    navigator.clipboard.writeText(hexes);
    copyAllBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyAllBtn.textContent = 'Copy All HEX';
    }, 1500);
  });

  exportCssBtn?.addEventListener('click', () => {
    const cssVars = extractedColors
      .map((c, idx) => `  --color-${idx + 1}: ${c.hex};`)
      .join('\n');
    const code = `:root {\n${cssVars}\n}`;
    navigator.clipboard.writeText(code);
    exportCssBtn.textContent = 'CSS Copied!';
    setTimeout(() => {
      exportCssBtn.textContent = 'Export CSS';
    }, 1500);
  });

  exportJsonBtn?.addEventListener('click', () => {
    const jsonStr = JSON.stringify(
      extractedColors.map((c) => ({ hex: c.hex, rgb: `rgb(${c.r}, ${c.g}, ${c.b})` })),
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    exportJsonBtn.textContent = 'JSON Copied!';
    setTimeout(() => {
      exportJsonBtn.textContent = 'Export JSON';
    }, 1500);
  });
});
