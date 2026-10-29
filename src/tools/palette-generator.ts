import { generateHarmonicPalette } from '../utils/designUtils.ts';
import { rgbToHex, hexToRgb } from '../utils/colorPickerUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initPaletteGenerator(): void {
  const seedInput = document.getElementById('pal-seed') as HTMLInputElement | null;
  const seedHexInput = document.getElementById('pal-seed-hex') as HTMLInputElement | null;
  const schemeSelect = document.getElementById('pal-scheme') as HTMLSelectElement | null;
  const generateBtn = document.getElementById('pal-generate-btn') as HTMLButtonElement | null;
  const colorsContainer = document.getElementById('pal-colors-container');
  const copyCssBtn = document.getElementById('pal-copy-css-btn') as HTMLButtonElement | null;
  const copyArrayBtn = document.getElementById('pal-copy-array-btn') as HTMLButtonElement | null;
  const downloadImgBtn = document.getElementById('pal-download-img-btn') as HTMLButtonElement | null;

  if (!colorsContainer) return;

  let currentPalette: string[] = ['#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#1E40AF'];
  const lockedIndices: Set<number> = new Set();

  function setSeed(hex: string, updateInputs = true) {
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (updateInputs) {
      if (seedInput) seedInput.value = hex;
      if (seedHexInput) seedHexInput.value = hex.toUpperCase();
    }
    doGenerate();
  }

  // Quick seed preset swatches
  document.querySelectorAll<HTMLButtonElement>('[data-pal-seed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = btn.getAttribute('data-pal-seed');
      if (c) setSeed(c, true);
    });
  });

  seedInput?.addEventListener('input', () => {
    if (seedHexInput && seedInput) seedHexInput.value = seedInput.value.toUpperCase();
    doGenerate();
  });

  seedHexInput?.addEventListener('input', () => {
    let val = seedHexInput.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      if (seedInput) seedInput.value = val;
      doGenerate();
    }
  });

  function renderPalette() {
    if (!colorsContainer) return;
    colorsContainer.innerHTML = '';

    currentPalette.forEach((hex, idx) => {
      const isLocked = lockedIndices.has(idx);
      const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
      const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      const textDark = lum > 0.6;

      const card = document.createElement('div');
      card.className = 'relative flex-1 min-h-[220px] sm:min-h-[320px] rounded-2xl flex flex-col justify-between p-4 transition-all duration-200 shadow-md group overflow-hidden';
      card.style.backgroundColor = hex;

      card.innerHTML = `
        <div class="flex items-center justify-between z-10">
          <button type="button" class="lock-btn p-2 rounded-xl backdrop-blur-md ${isLocked ? 'bg-black/40 text-white' : 'bg-white/30 text-slate-900 dark:text-white hover:bg-white/50'} transition-all cursor-pointer" title="${isLocked ? 'Unlock color' : 'Lock color'}">
            ${isLocked ? '🔒' : '🔓'}
          </button>
          <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg backdrop-blur-md bg-black/20 text-white">${idx + 1}</span>
        </div>
        <div class="z-10 bg-black/30 backdrop-blur-md rounded-xl p-3 text-white space-y-1">
          <div class="font-mono font-bold text-base tracking-wider">${hex.toUpperCase()}</div>
          <div class="text-[11px] opacity-80 font-mono">RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</div>
          <button type="button" class="copy-hex-btn w-full mt-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors cursor-pointer">Copy HEX</button>
        </div>
      `;

      card.querySelector('.lock-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lockedIndices.has(idx)) {
          lockedIndices.delete(idx);
        } else {
          lockedIndices.add(idx);
        }
        renderPalette();
      });

      card.querySelector('.copy-hex-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(hex).then(() => showToast(`Copied ${hex}!`, 'success'));
      });

      colorsContainer.appendChild(card);
    });
  }

  function doGenerate() {
    const seed = seedInput?.value || '#3B82F6';
    const scheme = (schemeSelect?.value || 'analogous') as any;
    const newColors = generateHarmonicPalette(seed, scheme);

    const merged = newColors.map((c, i) => (lockedIndices.has(i) ? currentPalette[i] : c));
    currentPalette = merged;
    renderPalette();
  }

  generateBtn?.addEventListener('click', doGenerate);
  schemeSelect?.addEventListener('change', doGenerate);
  seedInput?.addEventListener('input', doGenerate);

  // Spacebar to generate
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      doGenerate();
    }
  });

  copyCssBtn?.addEventListener('click', () => {
    const css = currentPalette.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n');
    const fullCss = `:root {\n${css}\n}`;
    navigator.clipboard.writeText(fullCss).then(() => showToast('CSS Variables copied!', 'success'));
  });

  copyArrayBtn?.addEventListener('click', () => {
    const json = JSON.stringify(currentPalette, null, 2);
    navigator.clipboard.writeText(json).then(() => showToast('Hex array copied!', 'success'));
  });

  downloadImgBtn?.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barW = canvas.width / currentPalette.length;
    currentPalette.forEach((hex, i) => {
      ctx.fillStyle = hex;
      ctx.fillRect(i * barW, 0, barW, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(hex.toUpperCase(), i * barW + 20, canvas.height - 30);
    });

    const a = document.createElement('a');
    a.download = 'toolora-color-palette.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Palette PNG downloaded!', 'success');
  });

  doGenerate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPaletteGenerator);
} else {
  initPaletteGenerator();
}
