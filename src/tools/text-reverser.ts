import { reverseText, type ReverseMode } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const inputArea = document.getElementById('rev-input') as HTMLTextAreaElement | null;
const outputArea = document.getElementById('rev-output') as HTMLTextAreaElement | null;
const modeSelect = document.getElementById('rev-mode') as HTMLSelectElement | null;
const copyBtn = document.getElementById('rev-copy-btn') as HTMLButtonElement | null;

export function initTextReverser(): void {
  if (!inputArea || !outputArea) return;

  function doReverse() {
    const text = inputArea?.value || '';
    const mode = (modeSelect?.value || 'chars') as ReverseMode;
    outputArea!.value = reverseText(text, mode);
  }

  inputArea.addEventListener('input', doReverse);
  modeSelect?.addEventListener('change', doReverse);

  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Reversed text copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextReverser);
} else {
  initTextReverser();
}
