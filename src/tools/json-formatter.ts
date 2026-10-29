import { formatJson, minifyJson } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_JSON = `{
  "tool": "Toolora",
  "category": "Developer Utilities",
  "features": ["100% Client-Side", "Zero Server Uploads", "Instant Processing"],
  "stats": {
    "totalTools": 89,
    "rating": 4.95,
    "active": true
  }
}`;

export function initJsonFormatter(): void {
  const inputEl = document.getElementById('json-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('json-output') as HTMLTextAreaElement | null;
  const indentSelect = document.getElementById('json-indent') as HTMLSelectElement | null;

  const statusBadge = document.getElementById('json-status-badge') as HTMLElement | null;
  const errorMsgEl = document.getElementById('json-error-msg') as HTMLElement | null;

  const btnFormat = document.getElementById('btn-format') as HTMLButtonElement | null;
  const btnMinify = document.getElementById('btn-minify') as HTMLButtonElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function doFormat(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;
    if (!raw.trim()) {
      outputEl.value = '';
      setStatus(null);
      return;
    }

    const spaceVal = indentSelect?.value === 'tab' ? '\t' : parseInt(indentSelect?.value || '2', 10);
    const res = formatJson(raw, spaceVal);

    if (res.isValid) {
      outputEl.value = res.formatted;
      setStatus(true);
    } else {
      outputEl.value = res.formatted;
      setStatus(false, res.error);
    }
  }

  function doMinify(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;
    if (!raw.trim()) {
      outputEl.value = '';
      setStatus(null);
      return;
    }

    const res = minifyJson(raw);
    if (res.isValid) {
      outputEl.value = res.formatted;
      setStatus(true);
      showToast('JSON minified to single line!', 'info');
    } else {
      setStatus(false, res.error);
    }
  }

  function setStatus(isValid: boolean | null, error?: string): void {
    if (!statusBadge || !errorMsgEl) return;

    if (isValid === null) {
      statusBadge.textContent = 'Ready';
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      errorMsgEl.classList.add('hidden');
      errorMsgEl.textContent = '';
      return;
    }

    if (isValid) {
      statusBadge.textContent = '✓ Valid JSON';
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      errorMsgEl.classList.add('hidden');
      errorMsgEl.textContent = '';
    } else {
      statusBadge.textContent = '✕ Invalid JSON';
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
      errorMsgEl.classList.remove('hidden');
      errorMsgEl.textContent = error || 'Syntax error in JSON';
    }
  }

  inputEl.addEventListener('input', doFormat);
  indentSelect?.addEventListener('change', doFormat);

  btnFormat?.addEventListener('click', () => {
    doFormat();
    showToast('Formatted JSON!', 'info');
  });

  btnMinify?.addEventListener('click', doMinify);

  btnSample?.addEventListener('click', () => {
    inputEl.value = SAMPLE_JSON;
    doFormat();
    showToast('Loaded sample JSON!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    setStatus(null);
  });

  btnCopy?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('JSON copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  btnDownload?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON file downloaded!', 'success');
  });

  // Initial sample
  if (!inputEl.value) {
    inputEl.value = SAMPLE_JSON;
  }
  doFormat();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJsonFormatter);
} else {
  initJsonFormatter();
}
