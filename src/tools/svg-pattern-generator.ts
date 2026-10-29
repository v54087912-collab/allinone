import { generateSvgPattern } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const previewBox = document.getElementById('pattern-preview-box') as HTMLElement | null;
  const patternTypeSelect = document.getElementById('pattern-type') as HTMLSelectElement | null;
  const tileSizeSlider = document.getElementById('pattern-tile-size') as HTMLInputElement | null;
  const elementSizeSlider = document.getElementById('pattern-elem-size') as HTMLInputElement | null;
  const strokeSlider = document.getElementById('pattern-stroke') as HTMLInputElement | null;
  const fgColorInput = document.getElementById('pattern-fg-color') as HTMLInputElement | null;
  const bgColorInput = document.getElementById('pattern-bg-color') as HTMLInputElement | null;
  const bgTransparentCheck = document.getElementById('pattern-bg-trans') as HTMLInputElement | null;
  const opacitySlider = document.getElementById('pattern-opacity') as HTMLInputElement | null;
  const copySvgBtn = document.getElementById('copy-pattern-svg-btn') as HTMLButtonElement | null;
  const copyCssBtn = document.getElementById('copy-pattern-css-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-pattern-svg-btn') as HTMLButtonElement | null;

  if (!previewBox) return;

  let currentPattern = { svg: '', dataUri: '', css: '' };

  function renderPattern() {
    const type = patternTypeSelect?.value || 'dots';
    const ts = Number(tileSizeSlider?.value || 36);
    const es = Number(elementSizeSlider?.value || 6);
    const sw = Number(strokeSlider?.value || 2);
    const fg = fgColorInput?.value || '#3b82f6';
    const isTrans = bgTransparentCheck?.checked ?? false;
    const bg = isTrans ? 'transparent' : bgColorInput?.value || '#ffffff';
    const op = Number(opacitySlider?.value || 100) / 100;

    currentPattern = generateSvgPattern(type, ts, es, sw, fg, bg, op);

    if (previewBox) {
      previewBox.style.backgroundColor = isTrans ? 'transparent' : bg;
      previewBox.style.backgroundImage = `url("${currentPattern.dataUri}")`;
    }
  }

  [
    patternTypeSelect,
    tileSizeSlider,
    elementSizeSlider,
    strokeSlider,
    fgColorInput,
    bgColorInput,
    bgTransparentCheck,
    opacitySlider
  ].forEach((ctrl) => {
    ctrl?.addEventListener('input', renderPattern);
    ctrl?.addEventListener('change', renderPattern);
  });

  copySvgBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(currentPattern.svg);
    copySvgBtn.textContent = 'SVG Copied!';
    setTimeout(() => {
      copySvgBtn.textContent = 'Copy SVG Code';
    }, 1200);
  });

  copyCssBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(currentPattern.css);
    copyCssBtn.textContent = 'CSS Copied!';
    setTimeout(() => {
      copyCssBtn.textContent = 'Copy CSS Background';
    }, 1200);
  });

  downloadBtn?.addEventListener('click', () => {
    const blob = new Blob([currentPattern.svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });

  renderPattern();
});
