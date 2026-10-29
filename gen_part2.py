import os

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'
TOOLS_DIR = os.path.join(PROJECT_DIR, 'src/tools')

# 5. Font Pairing Controller
font_pairing_ts = '''import { CURATED_FONT_PAIRINGS } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initFontPairing(): void {
  const pairingsContainer = document.getElementById('font-pairings-list');
  const previewHeading = document.getElementById('font-pair-heading') as HTMLInputElement | null;
  const previewBody = document.getElementById('font-pair-body') as HTMLTextAreaElement | null;
  const copyCssBtn = document.getElementById('font-copy-css-btn') as HTMLButtonElement | null;

  if (!pairingsContainer) return;

  let activePairing = CURATED_FONT_PAIRINGS[0];

  function render() {
    if (!pairingsContainer) return;
    pairingsContainer.innerHTML = '';

    CURATED_FONT_PAIRINGS.forEach((pair) => {
      const isSelected = pair.id === activePairing.id;
      const card = document.createElement('div');
      card.className = `p-5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">${pair.tag}</span>
          ${isSelected ? '<span class="text-xs text-blue-600 font-bold">Selected</span>' : ''}
        </div>
        <div class="text-lg font-bold text-slate-900 dark:text-white" style="font-family: ${pair.headingFont};">${pair.heading}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">Body: <span style="font-family: ${pair.bodyFont};">${pair.body}</span></div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${pair.description}</p>
      `;

      card.addEventListener('click', () => {
        activePairing = pair;
        applyPairing();
        render();
      });

      pairingsContainer.appendChild(card);
    });
  }

  function applyPairing() {
    const headingEl = document.getElementById('active-pair-heading-preview');
    const bodyEl = document.getElementById('active-pair-body-preview');
    const cssCode = document.getElementById('active-pair-css-code');

    if (headingEl) {
      headingEl.style.fontFamily = activePairing.headingFont;
      headingEl.textContent = previewHeading?.value || 'Designing Timeless Digital Experiences';
    }
    if (bodyEl) {
      bodyEl.style.fontFamily = activePairing.bodyFont;
      bodyEl.textContent = previewBody?.value || 'Great typography establishes visual hierarchy and guides readers effortlessly through your interface.';
    }
    if (cssCode) {
      const code = `/* Font Pairing: ${activePairing.heading} + ${activePairing.body} */\\nh1, h2, h3 {\\n  font-family: ${activePairing.headingFont};\\n}\\n\\nbody, p {\\n  font-family: ${activePairing.bodyFont};\\n}`;
      cssCode.textContent = code;
    }
  }

  previewHeading?.addEventListener('input', applyPairing);
  previewBody?.addEventListener('input', applyPairing);

  copyCssBtn?.addEventListener('click', () => {
    const code = document.getElementById('active-pair-css-code')?.textContent || '';
    if (code) {
      navigator.clipboard.writeText(code).then(() => showToast('CSS copied to clipboard!', 'success'));
    }
  });

  render();
  applyPairing();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFontPairing);
} else {
  initFontPairing();
}
'''

# 6. Font Preview Tool Controller
font_preview_ts = '''import { showToast } from '../shared/site-shell.ts';

const SAMPLE_FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Sans-Serif' },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'Sans-Serif' },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'Sans-Serif' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Sans-Serif' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Sans-Serif' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Serif' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'Serif' },
  { name: 'Lora', family: "'Lora', serif", category: 'Serif' },
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'Monospace' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'Monospace' },
  { name: 'Caveat', family: "'Caveat', cursive", category: 'Handwriting' },
  { name: 'Pacifico', family: "'Pacifico', cursive", category: 'Display' },
];

export function initFontPreview(): void {
  const textInput = document.getElementById('fp-text-input') as HTMLInputElement | null;
  const sizeSlider = document.getElementById('fp-size-slider') as HTMLInputElement | null;
  const sizeVal = document.getElementById('fp-size-val');
  const weightSelect = document.getElementById('fp-weight-select') as HTMLSelectElement | null;
  const categoryFilter = document.getElementById('fp-category-filter') as HTMLSelectElement | null;
  const gridContainer = document.getElementById('fp-font-grid');

  if (!gridContainer) return;

  function render() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const text = textInput?.value || 'The quick brown fox jumps over the lazy dog 1234567890';
    const size = sizeSlider?.value || '28';
    const weight = weightSelect?.value || '400';
    const cat = categoryFilter?.value || 'all';

    if (sizeVal) sizeVal.textContent = `${size}px`;

    const filtered = cat === 'all' ? SAMPLE_FONTS : SAMPLE_FONTS.filter((f) => f.category === cat);

    filtered.forEach((f) => {
      const card = document.createElement('div');
      card.className = 'p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3';

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <span class="font-bold text-sm text-slate-900 dark:text-white">${f.name}</span>
            <span class="ml-2 text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">${f.category}</span>
          </div>
          <button type="button" class="copy-font-btn text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Copy CSS</button>
        </div>
        <div class="overflow-x-auto py-2 leading-relaxed text-slate-900 dark:text-white" style="font-family: ${f.family}; font-size: ${size}px; font-weight: ${weight};">
          ${text}
        </div>
      `;

      card.querySelector('.copy-font-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(`font-family: ${f.family};`).then(() => showToast(`Copied ${f.name} CSS!`, 'success'));
      });

      gridContainer.appendChild(card);
    });
  }

  [textInput, sizeSlider, weightSelect, categoryFilter].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFontPreview);
} else {
  initFontPreview();
}
'''

# 7. Box Shadow Generator Controller
box_shadow_ts = '''import { formatBoxShadowCss, ShadowLayer } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initBoxShadow(): void {
  const previewBox = document.getElementById('shadow-preview-box');
  const offsetX = document.getElementById('shadow-x') as HTMLInputElement | null;
  const offsetY = document.getElementById('shadow-y') as HTMLInputElement | null;
  const blur = document.getElementById('shadow-blur') as HTMLInputElement | null;
  const spread = document.getElementById('shadow-spread') as HTMLInputElement | null;
  const color = document.getElementById('shadow-color') as HTMLInputElement | null;
  const opacity = document.getElementById('shadow-opacity') as HTMLInputElement | null;
  const inset = document.getElementById('shadow-inset') as HTMLInputElement | null;

  const valX = document.getElementById('val-shadow-x');
  const valY = document.getElementById('val-shadow-y');
  const valBlur = document.getElementById('val-shadow-blur');
  const valSpread = document.getElementById('val-shadow-spread');
  const valOpacity = document.getElementById('val-shadow-opacity');

  const cssOutput = document.getElementById('shadow-css-output') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('shadow-copy-btn') as HTMLButtonElement | null;

  if (!previewBox) return;

  function hexToRgba(hex: string, alpha: number): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function update() {
    const x = parseInt(offsetX?.value || '0', 10);
    const y = parseInt(offsetY?.value || '10', 10);
    const b = parseInt(blur?.value || '25', 10);
    const s = parseInt(spread?.value || '-5', 10);
    const hex = color?.value || '#000000';
    const op = parseFloat(opacity?.value || '0.15');
    const isInset = inset?.checked || false;

    if (valX) valX.textContent = `${x}px`;
    if (valY) valY.textContent = `${y}px`;
    if (valBlur) valBlur.textContent = `${b}px`;
    if (valSpread) valSpread.textContent = `${s}px`;
    if (valOpacity) valOpacity.textContent = `${Math.round(op * 100)}%`;

    const rgba = hexToRgba(hex, op);
    const layer: ShadowLayer = { x, y, blur: b, spread: s, color: rgba, inset: isInset };
    const css = `box-shadow: ${formatBoxShadowCss([layer])};`;

    if (previewBox) previewBox.style.boxShadow = formatBoxShadowCss([layer]);
    if (cssOutput) cssOutput.value = css;
  }

  [offsetX, offsetY, blur, spread, color, opacity, inset].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  copyBtn?.addEventListener('click', () => {
    if (!cssOutput) return;
    navigator.clipboard.writeText(cssOutput.value).then(() => showToast('CSS copied to clipboard!', 'success'));
  });

  // Presets
  document.querySelectorAll<HTMLButtonElement>('[data-shadow-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-shadow-preset');
      if (preset === 'soft') {
        if (offsetX) offsetX.value = '0';
        if (offsetY) offsetY.value = '15';
        if (blur) blur.value = '30';
        if (spread) spread.value = '-5';
        if (opacity) opacity.value = '0.12';
        if (inset) inset.checked = false;
      } else if (preset === 'float') {
        if (offsetX) offsetX.value = '0';
        if (offsetY) offsetY.value = '25';
        if (blur) blur.value = '50';
        if (spread) spread.value = '-12';
        if (opacity) opacity.value = '0.25';
        if (inset) inset.checked = false;
      } else if (preset === 'neon') {
        if (offsetX) offsetX.value = '0';
        if (offsetY) offsetY.value = '0';
        if (blur) blur.value = '30';
        if (spread) spread.value = '5';
        if (color) color.value = '#3b82f6';
        if (opacity) opacity.value = '0.6';
        if (inset) inset.checked = false;
      } else if (preset === 'inset') {
        if (offsetX) offsetX.value = '2';
        if (offsetY) offsetY.value = '4';
        if (blur) blur.value = '8';
        if (spread) spread.value = '0';
        if (opacity) opacity.value = '0.2';
        if (inset) inset.checked = true;
      }
      update();
    });
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoxShadow);
} else {
  initBoxShadow();
}
'''

# 8. Border Radius Generator Controller
border_radius_ts = '''import { formatBorderRadiusCss } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initBorderRadius(): void {
  const previewBox = document.getElementById('radius-preview-box');
  const tlSlider = document.getElementById('radius-tl') as HTMLInputElement | null;
  const trSlider = document.getElementById('radius-tr') as HTMLInputElement | null;
  const brSlider = document.getElementById('radius-br') as HTMLInputElement | null;
  const blSlider = document.getElementById('radius-bl') as HTMLInputElement | null;

  const tlVal = document.getElementById('val-radius-tl');
  const trVal = document.getElementById('val-radius-tr');
  const brVal = document.getElementById('val-radius-br');
  const blVal = document.getElementById('val-radius-bl');

  const cssOutput = document.getElementById('radius-css-output') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('radius-copy-btn') as HTMLButtonElement | null;
  const blobBtn = document.getElementById('radius-blob-btn') as HTMLButtonElement | null;

  if (!previewBox) return;

  function update() {
    const tl = parseInt(tlSlider?.value || '24', 10);
    const tr = parseInt(trSlider?.value || '24', 10);
    const br = parseInt(brSlider?.value || '24', 10);
    const bl = parseInt(blSlider?.value || '24', 10);

    if (tlVal) tlVal.textContent = `${tl}px`;
    if (trVal) trVal.textContent = `${tr}px`;
    if (brVal) brVal.textContent = `${br}px`;
    if (blVal) blVal.textContent = `${bl}px`;

    const cssVal = `${tl}px ${tr}px ${br}px ${bl}px`;
    if (previewBox) previewBox.style.borderRadius = cssVal;
    if (cssOutput) cssOutput.value = `border-radius: ${cssVal};`;
  }

  [tlSlider, trSlider, brSlider, blSlider].forEach((el) => {
    el?.addEventListener('input', update);
  });

  copyBtn?.addEventListener('click', () => {
    if (!cssOutput) return;
    navigator.clipboard.writeText(cssOutput.value).then(() => showToast('CSS copied to clipboard!', 'success'));
  });

  blobBtn?.addEventListener('click', () => {
    const r1 = Math.floor(20 + Math.random() * 60);
    const r2 = Math.floor(20 + Math.random() * 60);
    const r3 = Math.floor(20 + Math.random() * 60);
    const r4 = Math.floor(20 + Math.random() * 60);
    const r5 = 100 - r1;
    const r6 = 100 - r2;
    const r7 = 100 - r3;
    const r8 = 100 - r4;

    const blobCss = `${r1}% ${r5}% ${r2}% ${r6}% / ${r3}% ${r4}% ${r8}% ${r7}%`;
    if (previewBox) previewBox.style.borderRadius = blobCss;
    if (cssOutput) cssOutput.value = `border-radius: ${blobCss};`;
    showToast('Organic blob shape generated!', 'info');
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBorderRadius);
} else {
  initBorderRadius();
}
'''

# 9. SVG Shape Generator Controller
svg_shape_ts = '''import { generateSvgWave, generateSvgBlob } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initSvgShape(): void {
  const typeSelect = document.getElementById('svg-type') as HTMLSelectElement | null;
  const colorInput = document.getElementById('svg-color') as HTMLInputElement | null;
  const complexitySlider = document.getElementById('svg-complexity') as HTMLInputElement | null;
  const previewContainer = document.getElementById('svg-preview-container');
  const codeOutput = document.getElementById('svg-code-output') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('svg-copy-btn') as HTMLButtonElement | null;
  const downloadSvgBtn = document.getElementById('svg-download-btn') as HTMLButtonElement | null;
  const newShapeBtn = document.getElementById('svg-new-shape-btn') as HTMLButtonElement | null;

  if (!previewContainer) return;

  function update() {
    const type = typeSelect?.value || 'wave';
    const color = colorInput?.value || '#3b82f6';
    const complexity = parseInt(complexitySlider?.value || '5', 10);

    let svgData = { svgCode: '', path: '' };

    if (type === 'wave') {
      svgData = generateSvgWave(1440, 320, complexity, 100, color);
    } else {
      svgData = generateSvgBlob(400, complexity, 0.35, color);
    }

    if (previewContainer) previewContainer.innerHTML = svgData.svgCode;
    if (codeOutput) codeOutput.value = svgData.svgCode;
  }

  [typeSelect, colorInput, complexitySlider].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  newShapeBtn?.addEventListener('click', update);

  copyBtn?.addEventListener('click', () => {
    if (!codeOutput) return;
    navigator.clipboard.writeText(codeOutput.value).then(() => showToast('SVG code copied!', 'success'));
  });

  downloadSvgBtn?.addEventListener('click', () => {
    if (!codeOutput) return;
    const blob = new Blob([codeOutput.value], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shape-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('SVG file downloaded!', 'success');
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSvgShape);
} else {
  initSvgShape();
}
'''

with open(os.path.join(TOOLS_DIR, 'font-pairing.ts'), 'w') as f:
    f.write(font_pairing_ts)
with open(os.path.join(TOOLS_DIR, 'font-preview.ts'), 'w') as f:
    f.write(font_preview_ts)
with open(os.path.join(TOOLS_DIR, 'box-shadow.ts'), 'w') as f:
    f.write(box_shadow_ts)
with open(os.path.join(TOOLS_DIR, 'border-radius.ts'), 'w') as f:
    f.write(border_radius_ts)
with open(os.path.join(TOOLS_DIR, 'svg-shape.ts'), 'w') as f:
    f.write(svg_shape_ts)

print("Created font-pairing.ts, font-preview.ts, box-shadow.ts, border-radius.ts, svg-shape.ts")
