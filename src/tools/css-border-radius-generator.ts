/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initCssBorderRadiusGenerator(): void {
  const tlInput = document.getElementById('radius-tl') as HTMLInputElement | null;
  const trInput = document.getElementById('radius-tr') as HTMLInputElement | null;
  const brInput = document.getElementById('radius-br') as HTMLInputElement | null;
  const blInput = document.getElementById('radius-bl') as HTMLInputElement | null;
  const previewBox = document.getElementById('radius-preview-box') as HTMLDivElement | null;
  const cssCode = document.getElementById('radius-css-code') as HTMLPreElement | null;
  const copyBtn = document.getElementById('copy-css-btn') as HTMLButtonElement | null;

  function update() {
    const tl = tlInput?.value || '24';
    const tr = trInput?.value || '24';
    const br = brInput?.value || '24';
    const bl = blInput?.value || '24';

    const radiusVal = `${tl}px ${tr}px ${br}px ${bl}px`;

    if (previewBox) {
      previewBox.style.borderRadius = radiusVal;
    }
    if (cssCode) {
      cssCode.textContent = `border-radius: ${radiusVal};`;
    }
  }

  [tlInput, trInput, brInput, blInput].forEach(el => el?.addEventListener('input', update));

  if (copyBtn && cssCode) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cssCode.textContent || '');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy CSS'; }, 1500);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initCssBorderRadiusGenerator);
