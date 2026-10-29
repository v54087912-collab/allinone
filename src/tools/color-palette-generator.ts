/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initColorPaletteGenerator(): void {
  const paletteContainer = document.getElementById('palette-container') as HTMLDivElement | null;
  const generateBtn = document.getElementById('generate-palette-btn') as HTMLButtonElement | null;
  const harmonySelect = document.getElementById('harmony-select') as HTMLSelectElement | null;
  const baseColorInput = document.getElementById('base-color') as HTMLInputElement | null;
  const exportCssBtn = document.getElementById('export-css-btn') as HTMLButtonElement | null;

  function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexToHsl(hex: string): [number, number, number] {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  let currentPalette: string[] = [];

  function generate() {
    const baseHex = baseColorInput?.value || '#3b82f6';
    const [h, s, l] = hexToHsl(baseHex);
    const harmony = harmonySelect?.value || 'complementary';

    if (harmony === 'complementary') {
      currentPalette = [
        hslToHex(h, s, Math.min(90, l + 25)),
        hslToHex(h, s, l),
        hslToHex(h, Math.max(20, s - 30), l),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 180) % 360, s, Math.max(20, l - 25))
      ];
    } else if (harmony === 'analogous') {
      currentPalette = [
        hslToHex((h - 40 + 360) % 360, s, l),
        hslToHex((h - 20 + 360) % 360, s, l),
        hslToHex(h, s, l),
        hslToHex((h + 20) % 360, s, l),
        hslToHex((h + 40) % 360, s, l)
      ];
    } else if (harmony === 'triadic') {
      currentPalette = [
        hslToHex(h, s, l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
        hslToHex(h, s, Math.max(15, l - 30)),
        hslToHex((h + 120) % 360, s, Math.min(85, l + 25))
      ];
    } else {
      // Monochromatic
      currentPalette = [
        hslToHex(h, s, 92),
        hslToHex(h, s, 72),
        hslToHex(h, s, 52),
        hslToHex(h, s, 32),
        hslToHex(h, s, 15)
      ];
    }

    render();
  }

  function render() {
    if (!paletteContainer) return;
    paletteContainer.innerHTML = '';
    currentPalette.forEach(hex => {
      const div = document.createElement('div');
      div.className = 'flex flex-col items-center justify-between p-4 rounded-2xl h-44 cursor-pointer hover:scale-102 transition-all shadow-xs';
      div.style.backgroundColor = hex;
      div.innerHTML = `
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white">Click to Copy</span>
        <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/60 text-white uppercase">${hex}</span>
      `;
      div.addEventListener('click', async () => {
        await navigator.clipboard.writeText(hex);
        div.querySelector('span')!.textContent = 'Copied!';
        setTimeout(() => { div.querySelector('span')!.textContent = 'Click to Copy'; }, 1200);
      });
      paletteContainer.appendChild(div);
    });
  }

  if (generateBtn) generateBtn.addEventListener('click', generate);
  if (harmonySelect) harmonySelect.addEventListener('change', generate);
  if (baseColorInput) baseColorInput.addEventListener('input', generate);

  if (exportCssBtn) {
    exportCssBtn.addEventListener('click', async () => {
      const css = `:root {\n` + currentPalette.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n') + `\n}`;
      await navigator.clipboard.writeText(css);
      exportCssBtn.textContent = 'CSS Variables Copied!';
      setTimeout(() => { exportCssBtn.textContent = 'Copy CSS Variables'; }, 1500);
    });
  }

  generate();
}

document.addEventListener('DOMContentLoaded', initColorPaletteGenerator);
