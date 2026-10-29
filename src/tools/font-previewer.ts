/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initFontPreviewer(): void {
  const customTextInput = document.getElementById('custom-text') as HTMLInputElement | null;
  const fontSizeSlider = document.getElementById('font-size') as HTMLInputElement | null;
  const sizeValue = document.getElementById('size-value') as HTMLSpanElement | null;
  const fontCards = document.querySelectorAll<HTMLDivElement>('[data-font]');

  function update() {
    const text = customTextInput?.value || 'The quick brown fox jumps over the lazy dog 1234567890';
    const size = fontSizeSlider?.value || '24';
    if (sizeValue) sizeValue.textContent = `${size}px`;

    fontCards.forEach(card => {
      const p = card.querySelector<HTMLParagraphElement>('p');
      if (p) {
        p.textContent = text;
        p.style.fontSize = `${size}px`;
      }
    });
  }

  if (customTextInput) customTextInput.addEventListener('input', update);
  if (fontSizeSlider) fontSizeSlider.addEventListener('input', update);

  update();
}

document.addEventListener('DOMContentLoaded', initFontPreviewer);
