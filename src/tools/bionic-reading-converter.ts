/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertToBionic } from '../utils/handwritingUtils.ts';

export function initBionicReadingConverter(): void {
  const textInput = document.getElementById('bionic-input') as HTMLTextAreaElement | null;
  const fixationSlider = document.getElementById('fixation-slider') as HTMLInputElement | null;
  const fixationVal = document.getElementById('fixation-value') as HTMLSpanElement | null;
  const bionicOutput = document.getElementById('bionic-output') as HTMLDivElement | null;
  const fontSizeSlider = document.getElementById('font-size') as HTMLInputElement | null;
  const fontSelect = document.getElementById('font-family') as HTMLSelectElement | null;
  const themeSelect = document.getElementById('reader-theme') as HTMLSelectElement | null;
  const copyHtmlBtn = document.getElementById('copy-html-btn') as HTMLButtonElement | null;
  const copyTextBtn = document.getElementById('copy-text-btn') as HTMLButtonElement | null;

  function update() {
    const raw = textInput?.value || 'Bionic Reading is a reading system that guides the eyes through text with artificial fixation points. As a result, the reader focuses on the highlighted initial letters and lets the brain organ complete the words.';
    const fixPercent = parseFloat(fixationSlider?.value || '50') / 100;
    if (fixationVal) fixationVal.textContent = `${Math.round(fixPercent * 100)}%`;

    const html = convertToBionic(raw, fixPercent);
    if (bionicOutput) {
      bionicOutput.innerHTML = html.replace(/\n/g, '<br><br>');
      bionicOutput.style.fontSize = `${fontSizeSlider?.value || '18'}px`;
      bionicOutput.style.fontFamily = fontSelect?.value || 'system-ui, sans-serif';

      const theme = themeSelect?.value || 'default';
      bionicOutput.classList.remove('bg-white', 'bg-amber-50', 'bg-slate-950', 'text-slate-900', 'text-amber-950', 'text-slate-100');
      if (theme === 'sepia') {
        bionicOutput.classList.add('bg-amber-50', 'text-amber-950');
      } else if (theme === 'dark') {
        bionicOutput.classList.add('bg-slate-950', 'text-slate-100');
      } else {
        bionicOutput.classList.add('bg-white', 'text-slate-900', 'dark:bg-slate-900', 'dark:text-slate-100');
      }
    }
  }

  [textInput, fixationSlider, fontSizeSlider, fontSelect, themeSelect].forEach(el => {
    el?.addEventListener('input', update);
  });

  if (copyHtmlBtn && bionicOutput) {
    copyHtmlBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(bionicOutput.innerHTML);
      copyHtmlBtn.textContent = 'HTML Copied!';
      setTimeout(() => { copyHtmlBtn.textContent = 'Copy HTML'; }, 1500);
    });
  }

  if (copyTextBtn && textInput) {
    copyTextBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(textInput.value);
      copyTextBtn.textContent = 'Text Copied!';
      setTimeout(() => { copyTextBtn.textContent = 'Copy Raw Text'; }, 1500);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initBionicReadingConverter);
