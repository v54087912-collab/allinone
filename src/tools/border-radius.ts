import { formatBorderRadiusCss } from '../utils/designUtils.ts';
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
