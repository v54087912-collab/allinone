/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initFontPairingTool(): void {
  const headingFontSelect = document.getElementById('heading-font') as HTMLSelectElement | null;
  const bodyFontSelect = document.getElementById('body-font') as HTMLSelectElement | null;
  const presetSelect = document.getElementById('preset-select') as HTMLSelectElement | null;
  const previewHeading = document.getElementById('preview-heading') as HTMLHeadingElement | null;
  const previewBody = document.getElementById('preview-body') as HTMLParagraphElement | null;
  const copyCssBtn = document.getElementById('copy-css-btn') as HTMLButtonElement | null;

  const presets: Record<string, [string, string]> = {
    modern: ['Inter, sans-serif', 'system-ui, sans-serif'],
    editorial: ['Georgia, serif', 'system-ui, sans-serif'],
    minimal: ['Helvetica Neue, Arial, sans-serif', 'Courier New, monospace'],
    playful: ['Comic Sans MS, cursive', 'Arial, sans-serif'],
    classic: ['Times New Roman, serif', 'Georgia, serif']
  };

  function update() {
    const hFont = headingFontSelect?.value || 'Inter, sans-serif';
    const bFont = bodyFontSelect?.value || 'system-ui, sans-serif';

    if (previewHeading) previewHeading.style.fontFamily = hFont;
    if (previewBody) previewBody.style.fontFamily = bFont;
  }

  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const p = presets[presetSelect.value];
      if (p && headingFontSelect && bodyFontSelect) {
        headingFontSelect.value = p[0];
        bodyFontSelect.value = p[1];
        update();
      }
    });
  }

  [headingFontSelect, bodyFontSelect].forEach(el => el?.addEventListener('change', update));

  if (copyCssBtn) {
    copyCssBtn.addEventListener('click', async () => {
      const css = `h1, h2, h3 { font-family: ${headingFontSelect?.value}; }\nbody, p { font-family: ${bodyFontSelect?.value}; }`;
      await navigator.clipboard.writeText(css);
      copyCssBtn.textContent = 'CSS Copied!';
      setTimeout(() => { copyCssBtn.textContent = 'Copy Font Rules'; }, 1500);
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initFontPairingTool);
