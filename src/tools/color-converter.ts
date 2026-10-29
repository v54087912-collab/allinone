import { convertColorAll } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initColorConverter(): void {
  const colorTextInput = document.getElementById('color-input') as HTMLInputElement | null;
  const colorPickerInput = document.getElementById('color-picker-input') as HTMLInputElement | null;
  const swatchBox = document.getElementById('color-preview-box') as HTMLElement | null;

  const valHex = document.getElementById('val-hex') as HTMLInputElement | null;
  const valRgb = document.getElementById('val-rgb') as HTMLInputElement | null;
  const valHsl = document.getElementById('val-hsl') as HTMLInputElement | null;
  const valHsv = document.getElementById('val-hsv') as HTMLInputElement | null;
  const valCmyk = document.getElementById('val-cmyk') as HTMLInputElement | null;

  const sliderR = document.getElementById('slider-r') as HTMLInputElement | null;
  const sliderG = document.getElementById('slider-g') as HTMLInputElement | null;
  const sliderB = document.getElementById('slider-b') as HTMLInputElement | null;

  const valRText = document.getElementById('val-r-text') as HTMLElement | null;
  const valGText = document.getElementById('val-g-text') as HTMLElement | null;
  const valBText = document.getElementById('val-b-text') as HTMLElement | null;

  if (!colorTextInput) return;

  function updateColor(inputStr: string, syncSliders = true) {
    const res = convertColorAll(inputStr);

    if (swatchBox) swatchBox.style.backgroundColor = res.hex;
    if (colorPickerInput && res.hex.length === 7) {
      colorPickerInput.value = res.hex;
    }

    if (valHex) valHex.value = res.hex;
    if (valRgb) valRgb.value = res.rgb;
    if (valHsl) valHsl.value = res.hsl;
    if (valHsv) valHsv.value = res.hsv;
    if (valCmyk) valCmyk.value = res.cmyk;

    if (syncSliders) {
      if (sliderR) sliderR.value = `${res.r}`;
      if (sliderG) sliderG.value = `${res.g}`;
      if (sliderB) sliderB.value = `${res.b}`;
    }

    if (valRText) valRText.textContent = `${res.r}`;
    if (valGText) valGText.textContent = `${res.g}`;
    if (valBText) valBText.textContent = `${res.b}`;
  }

  colorTextInput.addEventListener('input', () => {
    updateColor(colorTextInput.value);
  });

  colorPickerInput?.addEventListener('input', () => {
    if (colorPickerInput) {
      colorTextInput.value = colorPickerInput.value;
      updateColor(colorPickerInput.value);
    }
  });

  function onSliderChange() {
    const r = parseInt(sliderR?.value || '0', 10);
    const g = parseInt(sliderG?.value || '0', 10);
    const b = parseInt(sliderB?.value || '0', 10);
    const rgbStr = `rgb(${r}, ${g}, ${b})`;
    if (colorTextInput) colorTextInput.value = rgbStr;
    updateColor(rgbStr, false);
  }

  sliderR?.addEventListener('input', onSliderChange);
  sliderG?.addEventListener('input', onSliderChange);
  sliderB?.addEventListener('input', onSliderChange);

  // Individual copy buttons
  document.querySelectorAll<HTMLButtonElement>('[data-copy-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-color');
      const input = document.getElementById(targetId || '') as HTMLInputElement | null;
      if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(
          () => showToast(`Copied ${input.value} to clipboard!`, 'success'),
          () => showToast('Failed to copy', 'error')
        );
      }
    });
  });

  // Color Swatch buttons
  document.querySelectorAll<HTMLButtonElement>('[data-swatch-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-swatch-color');
      if (color) {
        colorTextInput.value = color;
        updateColor(color);
      }
    });
  });

  // Initial
  if (!colorTextInput.value) {
    colorTextInput.value = '#3B82F6';
  }
  updateColor(colorTextInput.value);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initColorConverter);
} else {
  initColorConverter();
}
