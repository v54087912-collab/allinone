import { sortTextLines, type SortMode } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_LIST = `Item 10
Item 2
Zebra
Apple
banana
Elephant
Cat
Dog
Item 1
Item 20`;

export function initTextSorter(): void {
  const inputEl = document.getElementById('sort-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('sort-output') as HTMLTextAreaElement | null;

  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-sort-mode]');
  const optCase = document.getElementById('sort-case-sens') as HTMLInputElement | null;

  const lineCountEl = document.getElementById('stat-line-count') as HTMLElement | null;
  const activeModeEl = document.getElementById('stat-sort-mode') as HTMLElement | null;

  const copyBtn = document.getElementById('sort-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('sort-download-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('sort-clear-btn') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('sort-sample-btn') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  let currentMode: SortMode = 'az';

  function processText(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;

    const sorted = sortTextLines(text, currentMode, optCase?.checked ?? false);
    outputEl.value = sorted;

    const lines = text ? text.split(/\r?\n/).length : 0;
    if (lineCountEl) lineCountEl.textContent = `${lines}`;
    if (activeModeEl) activeModeEl.textContent = getModeLabel(currentMode);

    // Update active button state
    modeButtons.forEach((btn) => {
      const mode = btn.getAttribute('data-sort-mode');
      if (mode === currentMode) {
        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      }
    });
  }

  function getModeLabel(mode: SortMode): string {
    switch (mode) {
      case 'az': return 'Alphabetical (A → Z)';
      case 'za': return 'Alphabetical (Z → A)';
      case 'length-asc': return 'Length (Shortest First)';
      case 'length-desc': return 'Length (Longest First)';
      case 'natural': return 'Natural Numeric';
      case 'reverse': return 'Reverse Line Order';
      case 'random': return 'Random Shuffle';
    }
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-sort-mode') as SortMode;
      if (mode) {
        currentMode = mode;
        processText();
        showToast(`Sorted: ${getModeLabel(mode)}`, 'info');
      }
    });
  });

  inputEl.addEventListener('input', processText);
  optCase?.addEventListener('change', processText);

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
      () => showToast('Sorted lines copied to clipboard!', 'success'),
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
    a.download = `sorted-${currentMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sorted text file downloaded!', 'success');
  });

  processText();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextSorter);
} else {
  initTextSorter();
}
