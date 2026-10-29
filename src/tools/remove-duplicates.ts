import { removeDuplicateLines } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_LIST = `apple
banana
orange
apple
grape
banana
Orange
apple
mango
watermelon
grape`;

export function initRemoveDuplicates(): void {
  const inputEl = document.getElementById('dups-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('dups-output') as HTMLTextAreaElement | null;

  const optCase = document.getElementById('opt-case-sens') as HTMLInputElement | null;
  const optTrim = document.getElementById('opt-trim-lines') as HTMLInputElement | null;

  const origLinesEl = document.getElementById('stat-orig-lines') as HTMLElement | null;
  const uniqueLinesEl = document.getElementById('stat-unique-lines') as HTMLElement | null;
  const removedLinesEl = document.getElementById('stat-removed-lines') as HTMLElement | null;

  const copyBtn = document.getElementById('dups-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('dups-download-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('dups-clear-btn') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('dups-sample-btn') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function processText(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;

    const result = removeDuplicateLines(text, {
      caseSensitive: optCase?.checked ?? true,
      trimLines: optTrim?.checked ?? true,
    });

    outputEl.value = result.cleanedText;

    if (origLinesEl) origLinesEl.textContent = `${result.originalLinesCount}`;
    if (uniqueLinesEl) uniqueLinesEl.textContent = `${result.uniqueLinesCount}`;
    if (removedLinesEl) removedLinesEl.textContent = `${result.duplicatesRemoved}`;
  }

  inputEl.addEventListener('input', processText);
  optCase?.addEventListener('change', processText);
  optTrim?.addEventListener('change', processText);

  sampleBtn?.addEventListener('click', () => {
    inputEl.value = SAMPLE_LIST;
    processText();
    showToast('Loaded sample list!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    processText();
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('Unique lines copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  downloadBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unique-lines.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Unique lines file downloaded!', 'success');
  });

  processText();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRemoveDuplicates);
} else {
  initRemoveDuplicates();
}
