import { hexToRgb, rgbToHex, rgbToHsl, rgbToCmyk } from '../utils/colorPickerUtils.ts';
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

  document.querySelectorAll<HTMLButtonElement>('[data-hex-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const hex = btn.getAttribute('data-hex-preset');
      if (hex) {
        const rgb = hexToRgb(hex);
        if (rgb) updateFromRgb(rgb.r, rgb.g, rgb.b);
      }
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
