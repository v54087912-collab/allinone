import { formatBoxShadowCss, ShadowLayer } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initBoxShadow(): void {
  const previewBox = document.getElementById('shadow-preview-box');
  const offsetX = document.getElementById('shadow-x') as HTMLInputElement | null;
  const offsetY = document.getElementById('shadow-y') as HTMLInputElement | null;
  const blur = document.getElementById('shadow-blur') as HTMLInputElement | null;
  const spread = document.getElementById('shadow-spread') as HTMLInputElement | null;
  const color = document.getElementById('shadow-color') as HTMLInputElement | null;
  const colorHex = document.getElementById('shadow-color-hex') as HTMLInputElement | null;
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
    if (colorHex && color) colorHex.value = color.value.toUpperCase();
  }

  [offsetX, offsetY, blur, spread, color, opacity, inset].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  colorHex?.addEventListener('input', () => {
    let val = colorHex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val) && color) {
      color.value = val;
      update();
    }
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
