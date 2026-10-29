/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initCssBoxShadowGenerator(): void {
  const xInput = document.getElementById('shadow-x') as HTMLInputElement | null;
  const yInput = document.getElementById('shadow-y') as HTMLInputElement | null;
  const blurInput = document.getElementById('shadow-blur') as HTMLInputElement | null;
  const spreadInput = document.getElementById('shadow-spread') as HTMLInputElement | null;
  const colorInput = document.getElementById('shadow-color') as HTMLInputElement | null;
  const opacityInput = document.getElementById('shadow-opacity') as HTMLInputElement | null;
  const insetCheckbox = document.getElementById('shadow-inset') as HTMLInputElement | null;
  const previewBox = document.getElementById('shadow-preview-box') as HTMLDivElement | null;
  const cssCode = document.getElementById('shadow-css-code') as HTMLPreElement | null;
  const copyBtn = document.getElementById('copy-css-btn') as HTMLButtonElement | null;

  function update() {
    const x = xInput?.value || '0';
    const y = yInput?.value || '10';
    const blur = blurInput?.value || '25';
    const spread = spreadInput?.value || '-5';
    const hex = (colorInput?.value || '#000000').replace('#', '');
    const opacity = parseFloat(opacityInput?.value || '0.2');
    const isInset = insetCheckbox?.checked;

    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    const shadowVal = `${isInset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity})`;

    if (previewBox) {
      previewBox.style.boxShadow = shadowVal;
    }
    if (cssCode) {
      cssCode.textContent = `box-shadow: ${shadowVal};`;
    }
  }

  [xInput, yInput, blurInput, spreadInput, colorInput, opacityInput, insetCheckbox].forEach(el => {
    el?.addEventListener('input', update);
  });

  if (copyBtn && cssCode) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cssCode.textContent || '');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy CSS'; }, 1500);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initCssBoxShadowGenerator);
