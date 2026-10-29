import os

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'
TOOLS_DIR = os.path.join(PROJECT_DIR, 'src/tools')

# 1. Palette Generator Controller
palette_ts = '''import { generateHarmonicPalette } from '../utils/designUtils.ts';
import { rgbToHex, hexToRgb } from '../utils/colorPickerUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initPaletteGenerator(): void {
  const seedInput = document.getElementById('pal-seed') as HTMLInputElement | null;
  const schemeSelect = document.getElementById('pal-scheme') as HTMLSelectElement | null;
  const generateBtn = document.getElementById('pal-generate-btn') as HTMLButtonElement | null;
  const colorsContainer = document.getElementById('pal-colors-container');
  const copyCssBtn = document.getElementById('pal-copy-css-btn') as HTMLButtonElement | null;
  const copyArrayBtn = document.getElementById('pal-copy-array-btn') as HTMLButtonElement | null;
  const downloadImgBtn = document.getElementById('pal-download-img-btn') as HTMLButtonElement | null;

  if (!colorsContainer) return;

  let currentPalette: string[] = ['#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#1E40AF'];
  const lockedIndices: Set<number> = new Set();

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
'''

# 2. Gradient Generator Controller
gradient_ts = '''import { showToast } from '../shared/site-shell.ts';

export function initGradientGenerator(): void {
  const previewBox = document.getElementById('grad-preview');
  const typeSelect = document.getElementById('grad-type') as HTMLSelectElement | null;
  const angleSlider = document.getElementById('grad-angle') as HTMLInputElement | null;
  const angleVal = document.getElementById('grad-angle-val') as HTMLElement | null;
  const angleWrap = document.getElementById('grad-angle-wrap');
  const color1 = document.getElementById('grad-color-1') as HTMLInputElement | null;
  const color2 = document.getElementById('grad-color-2') as HTMLInputElement | null;
  const color3 = document.getElementById('grad-color-3') as HTMLInputElement | null;
  const cssOutput = document.getElementById('grad-css-output') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('grad-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('grad-download-btn') as HTMLButtonElement | null;
  const randomBtn = document.getElementById('grad-random-btn') as HTMLButtonElement | null;

  if (!previewBox) return;

  function buildCss(): string {
    const type = typeSelect?.value || 'linear';
    const angle = angleSlider?.value || '135';
    const c1 = color1?.value || '#3b82f6';
    const c2 = color2?.value || '#8b5cf6';
    const c3 = color3?.value || '#ec4899';

    if (type === 'linear') {
      return `background: linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%);`;
    } else if (type === 'radial') {
      return `background: radial-gradient(circle at center, ${c1} 0%, ${c2} 60%, ${c3} 100%);`;
    } else {
      return `background: conic-gradient(from ${angle}deg, ${c1}, ${c2}, ${c3}, ${c1});`;
    }
  }

  function update() {
    const css = buildCss();
    if (previewBox) {
      const gradVal = css.replace('background: ', '').replace(';', '');
      previewBox.style.background = gradVal;
    }
    if (cssOutput) cssOutput.value = css;
    if (angleVal && angleSlider) angleVal.textContent = `${angleSlider.value}°`;
    if (angleWrap) {
      angleWrap.style.display = typeSelect?.value === 'radial' ? 'none' : 'flex';
    }
  }

  [typeSelect, angleSlider, color1, color2, color3].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  copyBtn?.addEventListener('click', () => {
    if (!cssOutput) return;
    navigator.clipboard.writeText(cssOutput.value).then(() => showToast('CSS copied to clipboard!', 'success'));
  });

  randomBtn?.addEventListener('click', () => {
    const randHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    if (color1) color1.value = randHex();
    if (color2) color2.value = randHex();
    if (color3) color3.value = randHex();
    if (angleSlider) angleSlider.value = String(Math.floor(Math.random() * 360));
    update();
  });

  // Preset buttons
  document.querySelectorAll<HTMLButtonElement>('[data-grad-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const colors = btn.getAttribute('data-grad-preset')?.split(',') || [];
      if (colors[0] && color1) color1.value = colors[0];
      if (colors[1] && color2) color2.value = colors[1];
      if (colors[2] && color3) color3.value = colors[2];
      update();
    });
  });

  downloadBtn?.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const type = typeSelect?.value || 'linear';
    const c1 = color1?.value || '#3b82f6';
    const c2 = color2?.value || '#8b5cf6';
    const c3 = color3?.value || '#ec4899';

    if (type === 'radial') {
      const grad = ctx.createRadialGradient(960, 540, 50, 960, 540, 960);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3);
      ctx.fillStyle = grad;
    } else {
      const rad = ((parseInt(angleSlider?.value || '135', 10) - 90) * Math.PI) / 180;
      const x1 = 960 - Math.cos(rad) * 960;
      const y1 = 540 - Math.sin(rad) * 540;
      const x2 = 960 + Math.cos(rad) * 960;
      const y2 = 540 + Math.sin(rad) * 540;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3);
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, 1920, 1080);

    const a = document.createElement('a');
    a.download = 'gradient-wallpaper.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('High-res wallpaper downloaded!', 'success');
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGradientGenerator);
} else {
  initGradientGenerator();
}
'''

# 3. HEX to RGB Converter Controller
hex_rgb_ts = '''import { hexToRgb, rgbToHex, rgbToHsl, rgbToCmyk } from '../utils/colorPickerUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initHexToRgb(): void {
  const hexInput = document.getElementById('color-hex') as HTMLInputElement | null;
  const pickerInput = document.getElementById('color-picker') as HTMLInputElement | null;
  const swatch = document.getElementById('color-swatch');

  const rSlider = document.getElementById('slider-r') as HTMLInputElement | null;
  const gSlider = document.getElementById('slider-g') as HTMLInputElement | null;
  const bSlider = document.getElementById('slider-b') as HTMLInputElement | null;
  const rVal = document.getElementById('val-r');
  const gVal = document.getElementById('val-g');
  const bVal = document.getElementById('val-b');

  const outHex = document.getElementById('out-hex');
  const outRgb = document.getElementById('out-rgb');
  const outHsl = document.getElementById('out-hsl');
  const outCmyk = document.getElementById('out-cmyk');

  function updateFromRgb(r: number, g: number, b: number) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    if (swatch) swatch.style.backgroundColor = hex;
    if (hexInput) hexInput.value = hex.toUpperCase();
    if (pickerInput) pickerInput.value = hex;

    if (rSlider) rSlider.value = String(r);
    if (gSlider) gSlider.value = String(g);
    if (bSlider) bSlider.value = String(b);
    if (rVal) rVal.textContent = String(r);
    if (gVal) gVal.textContent = String(g);
    if (bVal) bVal.textContent = String(b);

    if (outHex) outHex.textContent = hex.toUpperCase();
    if (outRgb) outRgb.textContent = `rgb(${r}, ${g}, ${b})`;
    if (outHsl) outHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    if (outCmyk) outCmyk.textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  }

  hexInput?.addEventListener('input', () => {
    let val = hexInput.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    const rgb = hexToRgb(val);
    if (rgb) updateFromRgb(rgb.r, rgb.g, rgb.b);
  });

  pickerInput?.addEventListener('input', () => {
    const rgb = hexToRgb(pickerInput.value);
    if (rgb) updateFromRgb(rgb.r, rgb.g, rgb.b);
  });

  [rSlider, gSlider, bSlider].forEach((slider) => {
    slider?.addEventListener('input', () => {
      const r = parseInt(rSlider?.value || '0', 10);
      const g = parseInt(gSlider?.value || '0', 10);
      const b = parseInt(bSlider?.value || '0', 10);
      updateFromRgb(r, g, b);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const text = document.getElementById(targetId || '')?.textContent || '';
      if (text) {
        navigator.clipboard.writeText(text).then(() => showToast(`Copied ${text}!`, 'success'));
      }
    });
  });

  updateFromRgb(59, 130, 246);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHexToRgb);
} else {
  initHexToRgb();
}
'''

# 4. Contrast Checker Controller
contrast_ts = '''import { calculateContrastRatio } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initContrastChecker(): void {
  const fgColor = document.getElementById('contrast-fg') as HTMLInputElement | null;
  const fgHex = document.getElementById('contrast-fg-hex') as HTMLInputElement | null;
  const bgColor = document.getElementById('contrast-bg') as HTMLInputElement | null;
  const bgHex = document.getElementById('contrast-bg-hex') as HTMLInputElement | null;
  const swapBtn = document.getElementById('contrast-swap-btn') as HTMLButtonElement | null;

  const previewBox = document.getElementById('contrast-preview-box');
  const previewText = document.querySelectorAll('.contrast-preview-text');
  const ratioBadge = document.getElementById('contrast-ratio-badge');
  const scoreBadge = document.getElementById('contrast-score-badge');

  const aaNormal = document.getElementById('status-aa-normal');
  const aaLarge = document.getElementById('status-aa-large');
  const aaaNormal = document.getElementById('status-aaa-normal');
  const aaaLarge = document.getElementById('status-aaa-large');

  function update() {
    const fg = fgHex?.value || '#000000';
    const bg = bgHex?.value || '#FFFFFF';

    if (fgColor) fgColor.value = fg;
    if (bgColor) bgColor.value = bg;

    if (previewBox) previewBox.style.backgroundColor = bg;
    previewText.forEach((el) => {
      (el as HTMLElement).style.color = fg;
    });

    const res = calculateContrastRatio(fg, bg);
    if (ratioBadge) ratioBadge.textContent = res.ratioFormatted;
    if (scoreBadge) {
      scoreBadge.textContent = res.score;
      const colorMap = {
        Excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        Good: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        Fair: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        Poor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      };
      scoreBadge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase ${colorMap[res.score]}`;
    }

    const setStatus = (el: HTMLElement | null, pass: boolean) => {
      if (!el) return;
      el.textContent = pass ? 'PASS' : 'FAIL';
      el.className = `px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${pass ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`;
    };

    setStatus(aaNormal, res.aaNormal);
    setStatus(aaLarge, res.aaLarge);
    setStatus(aaaNormal, res.aaaNormal);
    setStatus(aaaLarge, res.aaaLarge);
  }

  fgColor?.addEventListener('input', () => {
    if (fgHex && fgColor) fgHex.value = fgColor.value.toUpperCase();
    update();
  });
  fgHex?.addEventListener('input', () => {
    let val = fgHex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      if (fgColor) fgColor.value = val;
      update();
    }
  });

  bgColor?.addEventListener('input', () => {
    if (bgHex && bgColor) bgHex.value = bgColor.value.toUpperCase();
    update();
  });
  bgHex?.addEventListener('input', () => {
    let val = bgHex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      if (bgColor) bgColor.value = val;
      update();
    }
  });

  swapBtn?.addEventListener('click', () => {
    const temp = fgHex?.value || '#000000';
    if (fgHex && bgHex) {
      fgHex.value = bgHex.value;
      bgHex.value = temp;
    }
    update();
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContrastChecker);
} else {
  initContrastChecker();
}
'''

# Write these first 4 controllers
with open(os.path.join(TOOLS_DIR, 'palette-generator.ts'), 'w') as f:
    f.write(palette_ts)
with open(os.path.join(TOOLS_DIR, 'gradient-generator.ts'), 'w') as f:
    f.write(gradient_ts)
with open(os.path.join(TOOLS_DIR, 'hex-to-rgb.ts'), 'w') as f:
    f.write(hex_rgb_ts)
with open(os.path.join(TOOLS_DIR, 'contrast-checker.ts'), 'w') as f:
    f.write(contrast_ts)

print("Created palette-generator.ts, gradient-generator.ts, hex-to-rgb.ts, contrast-checker.ts")
