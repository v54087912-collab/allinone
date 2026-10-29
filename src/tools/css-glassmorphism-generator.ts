/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateGlassmorphismStyles } from '../utils/vectorDesignUtils.ts';

export function initCssGlassmorphismGenerator(): void {
  const blurInput = document.getElementById('glass-blur') as HTMLInputElement | null;
  const opacityInput = document.getElementById('glass-opacity') as HTMLInputElement | null;
  const borderInput = document.getElementById('glass-border') as HTMLInputElement | null;
  const shadowInput = document.getElementById('glass-shadow') as HTMLInputElement | null;
  const colorInput = document.getElementById('glass-color') as HTMLInputElement | null;
  const previewBox = document.getElementById('glass-preview-box') as HTMLDivElement | null;
  const cssCode = document.getElementById('glass-css-code') as HTMLPreElement | null;
  const copyBtn = document.getElementById('copy-css-btn') as HTMLButtonElement | null;

  function update() {
    const blur = parseFloat(blurInput?.value || '16');
    const opacity = parseFloat(opacityInput?.value || '0.25');
    const border = parseFloat(borderInput?.value || '0.2');
    const shadow = parseFloat(shadowInput?.value || '0.5');
    const color = colorInput?.value || '#ffffff';

    const styles = generateGlassmorphismStyles({
      blurPx: blur,
      bgOpacity: opacity,
      bgColorHex: color,
      borderOpacity: border,
      shadowIntensity: shadow
    });

    if (previewBox) {
      previewBox.style.cssText = styles.css;
    }
    if (cssCode) {
      cssCode.textContent = styles.css;
    }
  }

  [blurInput, opacityInput, borderInput, shadowInput, colorInput].forEach(el => el?.addEventListener('input', update));

  if (copyBtn && cssCode) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cssCode.textContent || '');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy CSS'; }, 1500);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initCssGlassmorphismGenerator);
